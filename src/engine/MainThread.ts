import { getGPUTier } from "detect-gpu";

import GameWorker from "./GameWorker?worker";
import { WorkerMessageType, InitializeGameWorkerMessage, InitializeRenderWorkerMessage } from "./WorkerMessage";
import {
  ConsumerThreadContext,
  Message,
  registerModules,
  SingleConsumerThreadSharedState,
  Thread,
} from "./module/module.common";
import mainThreadConfig from "./config.main";
import { MockMessagePort } from "./module/MockMessageChannel";
import { getLocalResources, MainWorld, ResourceLoaderSystem } from "./resource/resource.main";
import { waitUntil } from "./utils/waitUntil";
import {
  gpuTierToRenderQuality,
  LOCAL_STORAGE_RENDER_QUALITY,
  RenderQuality,
  RenderQualitySetting,
} from "./renderer/renderer.common";

export type MainThreadSystem = (state: IMainThreadContext) => void;

export interface IMainThreadContext extends ConsumerThreadContext {
  useOffscreenCanvas: boolean;
  mainToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  canvas: HTMLCanvasElement;
  animationFrameId?: number;
  initialGameWorkerState: { [key: string]: any };
  initialRenderWorkerState: { [key: string]: any };
  worldResource: MainWorld;
  supportedXRSessionModes: XRSessionMode[] | false;
  dt: number;
  elapsed: number;
  quality: RenderQuality;
}

async function getSupportedXRSessionModes(): Promise<false | XRSessionMode[]> {
  let supportedXRSessionModes: XRSessionMode[] | false = false;

  if ("xr" in navigator && navigator.xr) {
    supportedXRSessionModes = [];

    if (await navigator.xr.isSessionSupported("immersive-ar")) {
      supportedXRSessionModes.push("immersive-ar");
    }

    if (await navigator.xr.isSessionSupported("immersive-vr")) {
      supportedXRSessionModes.push("immersive-vr");
    }

    if (supportedXRSessionModes.length === 0) {
      return false;
    }

    return supportedXRSessionModes;
  }

  return false;
}

async function getRenderQuality() {
  const benchmarksURL = new URL("/detect-gpu-benchmarks", document.location.href).href;

  const qualitySettingStr = localStorage.getItem(LOCAL_STORAGE_RENDER_QUALITY);
  const qualitySetting = qualitySettingStr ? JSON.parse(qualitySettingStr) : undefined;

  let quality: RenderQuality;

  if (!qualitySetting || qualitySetting === RenderQualitySetting.Auto) {
    const result = await getGPUTier({ benchmarksURL, mobileTiers: [0, 60, 90, 120], desktopTiers: [0, 60, 90, 120] });

    console.info(`GPU Detected: "${result.gpu}" Tier: ${result.tier}`);

    if (result.type !== "BENCHMARK") {
      quality = RenderQuality.Medium;
    } else {
      quality = gpuTierToRenderQuality(result.tier);
    }
  } else {
    if (qualitySetting === RenderQualitySetting.Low) {
      quality = RenderQuality.Low;
    } else if (qualitySetting === RenderQualitySetting.Medium) {
      quality = RenderQuality.Medium;
    } else if (qualitySetting === RenderQualitySetting.High) {
      quality = RenderQuality.High;
    } else if (qualitySetting === RenderQualitySetting.Ultra) {
      quality = RenderQuality.Ultra;
    } else {
      quality = RenderQuality.Medium;
    }
  }

  return quality;
}

export async function MainThread(canvas: HTMLCanvasElement) {
  const supportsOffscreenCanvas = !!window.OffscreenCanvas;
  const [, hashSearch] = window.location.hash.split("?");
  const renderMain = new URLSearchParams(window.location.search || hashSearch).get("renderMain");

  const supportedXRSessionModes = await getSupportedXRSessionModes();

  const quality = await getRenderQuality();
  const useOffscreenCanvas = supportsOffscreenCanvas && renderMain === null && !supportedXRSessionModes;

  const singleConsumerThreadSharedState: SingleConsumerThreadSharedState | undefined = useOffscreenCanvas
    ? undefined
    : {
        useXRViewerWorldMatrix: false,
        xrViewerWorldMatrix: new Float32Array(16),
        update: () => {},
      };

  const gameWorker = new GameWorker();
  const renderWorker = await initRenderWorker(canvas, gameWorker, useOffscreenCanvas, singleConsumerThreadSharedState);
  const interWorkerMessageChannel = new MessageChannel();

  function mainThreadSendMessage<M extends Message<any>>(thread: Thread, message: M, transferList?: Transferable[]) {
    if (thread === Thread.Game) {
      gameWorker.postMessage({ dest: thread, message }, transferList);
    } else if (thread === Thread.Render) {
      renderWorker.postMessage({ dest: thread, message }, transferList);
    }
  }

  const mainToGameTripleBufferFlags = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)).fill(0x6);
  const renderToGameTripleBufferFlags = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)).fill(0x6);
  const gameToRenderTripleBufferFlags = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)).fill(0x6);
  const gameToMainTripleBufferFlags = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)).fill(0x6);

  const ctx: IMainThreadContext = {
    thread: Thread.Main,
    mainToGameTripleBufferFlags,
    gameToMainTripleBufferFlags,
    systems: mainThreadConfig.systems,
    modules: new Map(),
    useOffscreenCanvas,
    canvas,
    messageHandlers: new Map(),
    initialGameWorkerState: {},
    initialRenderWorkerState: {},
    sendMessage: mainThreadSendMessage,
    // TODO: figure out how to create the main thread context such that this is initially set
    worldResource: undefined as any,
    supportedXRSessionModes,
    isStaleFrame: false,
    dt: 0,
    elapsed: 0,
    tick: 0,
    singleConsumerThreadSharedState,
    quality,
  };

  function onWorkerMessage(event: MessageEvent) {
    const { message, dest } = event.data;

    if (dest !== Thread.Main) {
      return;
    }

    const handlers = ctx.messageHandlers.get(message.type);

    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i](ctx, message);
      }
    }
  }

  gameWorker.addEventListener("message", onWorkerMessage);
  renderWorker.addEventListener("message", onWorkerMessage as any);

  /* Register module loader event handlers before we send the message (sendMessage synchronous to RenderThread when RenderThread is running on MainThread)*/
  const moduleLoaderPromise = registerModules(Thread.Main, ctx, mainThreadConfig.modules);

  /* Initialize workers */

  ctx.sendMessage(
    Thread.Game,
    {
      type: WorkerMessageType.InitializeGameWorker,
      renderWorkerMessagePort: useOffscreenCanvas ? interWorkerMessageChannel.port1 : undefined,
      mainToGameTripleBufferFlags,
      gameToMainTripleBufferFlags,
      gameToRenderTripleBufferFlags,
      renderToGameTripleBufferFlags,
    } as InitializeGameWorkerMessage,
    useOffscreenCanvas ? [interWorkerMessageChannel.port1] : undefined
  );

  ctx.sendMessage(
    Thread.Render,
    {
      type: WorkerMessageType.InitializeRenderWorker,
      gameWorkerMessageTarget: useOffscreenCanvas ? interWorkerMessageChannel.port2 : undefined,
      gameToRenderTripleBufferFlags,
      renderToGameTripleBufferFlags,
    } as InitializeRenderWorkerMessage,
    useOffscreenCanvas ? [interWorkerMessageChannel.port2] : undefined
  );

  /* Initialize all modules and retrieve data needed to send to workers */

  const disposeModules = await moduleLoaderPromise;

  ctx.worldResource = await waitUntil(() => {
    ResourceLoaderSystem(ctx);
    return getLocalResources(ctx, MainWorld)[0];
  });

  /* Update loop */

  const update = () => {
    const now = performance.now();
    ctx.dt = (now - ctx.elapsed) / 1000;
    ctx.elapsed = now;

    for (let i = 0; i < ctx.systems.length; i++) {
      ctx.systems[i](ctx);
    }
  };

  function updateLoop() {
    update();
    ctx.animationFrameId = requestAnimationFrame(updateLoop);
  }

  console.log("MainThread initialized");

  if (singleConsumerThreadSharedState) {
    singleConsumerThreadSharedState.update = update;
  } else {
    updateLoop();
  }

  return {
    ctx,
    dispose() {
      if (ctx.animationFrameId !== undefined) {
        cancelAnimationFrame(ctx.animationFrameId);
      }

      disposeModules();

      gameWorker.removeEventListener("message", onWorkerMessage);
      renderWorker.removeEventListener("message", onWorkerMessage as any);

      if (gameWorker instanceof Worker) {
        gameWorker.terminate();
      }

      if (renderWorker instanceof Worker) {
        renderWorker.terminate();
      }
    },
  };
}

async function initRenderWorker(
  canvas: HTMLCanvasElement,
  gameWorker: Worker,
  useOffscreenCanvas: boolean,
  singleConsumerThreadSharedState?: SingleConsumerThreadSharedState
): Promise<Worker | MockMessagePort> {
  if (useOffscreenCanvas) {
    console.info("Browser supports OffscreenCanvas, rendering in WebWorker.");
    const { default: RenderWorker } = await import("./RenderWorker?worker");
    return new RenderWorker();
  } else {
    console.info("Browser does not support OffscreenCanvas, rendering on main thread.");
    const { default: initRenderWorkerOnMainThread } = await import("./RenderWorker");
    return initRenderWorkerOnMainThread(canvas, gameWorker, singleConsumerThreadSharedState!);
  }
}
