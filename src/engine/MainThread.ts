import GameWorker from "./GameWorker?worker";
import { WorkerMessageType, InitializeGameWorkerMessage, InitializeRenderWorkerMessage } from "./WorkerMessage";
import { BaseThreadContext, Message, registerModules, Thread } from "./module/module.common";
import mainThreadConfig from "./config.main";
import { swapReadBufferFlags, swapWriteBufferFlags } from "./allocator/TripleBuffer";
import { MockMessagePort } from "./module/MockMessageChannel";

export type MainThreadSystem = (state: IMainThreadContext) => void;

export interface IMainThreadContext extends BaseThreadContext {
  useOffscreenCanvas: boolean;
  mainToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  canvas: HTMLCanvasElement;
  animationFrameId?: number;
  initialGameWorkerState: { [key: string]: any };
  initialRenderWorkerState: { [key: string]: any };
}

export async function MainThread(canvas: HTMLCanvasElement) {
  const supportsOffscreenCanvas = !!window.OffscreenCanvas;
  const [, hashSearch] = window.location.hash.split("?");
  const renderMain = new URLSearchParams(window.location.search || hashSearch).get("renderMain");
  const useOffscreenCanvas = supportsOffscreenCanvas && renderMain === null;

  const gameWorker = new GameWorker();
  const renderWorker = await initRenderWorker(canvas, gameWorker, useOffscreenCanvas);
  const interWorkerMessageChannel = new MessageChannel();

  function mainThreadSendMessage<M extends Message<any>>(thread: Thread, message: M, transferList?: Transferable[]) {
    if (thread === Thread.Game) {
      gameWorker.postMessage({ dest: thread, message }, transferList);
    } else if (thread === Thread.Render) {
      renderWorker.postMessage({ dest: thread, message }, transferList);
    }
  }

  const mainToGameTripleBufferFlags = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)).fill(0x6);
  const gameToRenderTripleBufferFlags = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)).fill(0x6);
  const gameToMainTripleBufferFlags = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)).fill(0x6);

  const context: IMainThreadContext = {
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
  };

  function onWorkerMessage(event: MessageEvent) {
    const { message, dest } = event.data;

    if (dest !== Thread.Main) {
      return;
    }

    const handlers = context.messageHandlers.get(message.type);

    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i](context, message);
      }
    }
  }

  gameWorker.addEventListener("message", onWorkerMessage);
  renderWorker.addEventListener("message", onWorkerMessage as any);

  /* Register module loader event handlers before we send the message (sendMessage synchronous to RenderThread when RenderThread is running on MainThread)*/
  const moduleLoaderPromise = registerModules(Thread.Main, context, mainThreadConfig.modules);

  /* Initialize workers */

  context.sendMessage(
    Thread.Game,
    {
      type: WorkerMessageType.InitializeGameWorker,
      renderWorkerMessagePort: useOffscreenCanvas ? interWorkerMessageChannel.port1 : undefined,
      mainToGameTripleBufferFlags,
      gameToMainTripleBufferFlags,
      gameToRenderTripleBufferFlags,
    } as InitializeGameWorkerMessage,
    useOffscreenCanvas ? [interWorkerMessageChannel.port1] : undefined
  );

  context.sendMessage(
    Thread.Render,
    {
      type: WorkerMessageType.InitializeRenderWorker,
      gameWorkerMessageTarget: useOffscreenCanvas ? interWorkerMessageChannel.port2 : undefined,
      gameToRenderTripleBufferFlags,
    } as InitializeRenderWorkerMessage,
    useOffscreenCanvas ? [interWorkerMessageChannel.port2] : undefined
  );

  /* Initialize all modules and retrieve data needed to send to workers */

  const disposeModules = await moduleLoaderPromise;

  /* Start Workers */

  context.sendMessage(Thread.Render, {
    type: WorkerMessageType.StartRenderWorker,
  });

  context.sendMessage(Thread.Render, {
    type: WorkerMessageType.StartGameWorker,
  });

  /* Update loop */

  function update() {
    swapReadBufferFlags(context.gameToMainTripleBufferFlags);

    for (let i = 0; i < context.systems.length; i++) {
      context.systems[i](context);
    }

    swapWriteBufferFlags(context.mainToGameTripleBufferFlags);

    context.animationFrameId = requestAnimationFrame(update);
  }

  console.log("MainThread initialized");

  update();

  return {
    context,
    dispose() {
      if (context.animationFrameId !== undefined) {
        cancelAnimationFrame(context.animationFrameId);
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
  useOffscreenCanvas: boolean
): Promise<Worker | MockMessagePort> {
  if (useOffscreenCanvas) {
    console.info("Browser supports OffscreenCanvas, rendering in WebWorker.");
    const { default: RenderWorker } = await import("./RenderWorker?worker");
    return new RenderWorker();
  } else {
    console.info("Browser does not support OffscreenCanvas, rendering on main thread.");
    const { default: initRenderWorkerOnMainThread } = await import("./RenderWorker");
    return initRenderWorkerOnMainThread(canvas, gameWorker);
  }
}
