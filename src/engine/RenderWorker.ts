import { InitializeRenderWorkerMessage, WorkerMessageType } from "./WorkerMessage";
import { Message, registerModules, SingleConsumerThreadSharedState, Thread } from "./module/module.common";
import renderConfig from "./config.render";
import { RenderThreadState, startRenderLoop } from "./renderer/renderer.render";
import { MockMessageChannel, MockWorkerMessageChannel, MockMessagePort } from "./module/MockMessageChannel";
import { getLocalResources, RenderWorld, ResourceLoaderSystem } from "./resource/resource.render";
import { waitUntil } from "./utils/waitUntil";

// TODO: Figure out how to import this type without polluting global scope and causing issues with Window
type DedicatedWorkerGlobalScope = any;

export default function initRenderWorkerOnMainThread(
  canvas: HTMLCanvasElement,
  gameWorker: Worker,
  singleConsumerThreadSharedState: SingleConsumerThreadSharedState
) {
  const renderGameMessageChannel = new MockWorkerMessageChannel(gameWorker);
  const rendererMainMessageChannel = new MockMessageChannel();
  startRenderWorker(
    rendererMainMessageChannel.port1,
    canvas,
    renderGameMessageChannel.port1,
    singleConsumerThreadSharedState
  );
  rendererMainMessageChannel.port1.start();
  rendererMainMessageChannel.port2.start();
  return rendererMainMessageChannel.port2;
}

const isWorker = typeof (window as any) === "undefined";

if (isWorker) {
  startRenderWorker(self as DedicatedWorkerGlobalScope);
}

function startRenderWorker(
  workerScope: DedicatedWorkerGlobalScope | MessagePort,
  canvas?: HTMLCanvasElement,
  mockGameWorkerPort?: MockMessagePort,
  singleConsumerThreadSharedState?: SingleConsumerThreadSharedState
) {
  const onInitMessage = (event: MessageEvent) => {
    if (typeof event.data !== "object") {
      return;
    }

    const { message, dest } = event.data;

    if (dest !== Thread.Render) {
      return;
    }

    if (message.type === WorkerMessageType.InitializeRenderWorker) {
      workerScope.removeEventListener("message", onInitMessage as any);
      onInit(workerScope, message, canvas, mockGameWorkerPort, singleConsumerThreadSharedState).catch(console.error);
    }
  };

  workerScope.addEventListener("message", onInitMessage as any);
}

async function onInit(
  workerScope: DedicatedWorkerGlobalScope | MessagePort,
  {
    gameWorkerMessageTarget,
    gameToRenderTripleBufferFlags,
    renderToGameTripleBufferFlags,
  }: InitializeRenderWorkerMessage,
  canvas?: HTMLCanvasElement,
  mockGameWorkerPort?: MockMessagePort,
  singleConsumerThreadSharedState?: SingleConsumerThreadSharedState
) {
  const gameWorkerMessagePort = gameWorkerMessageTarget || mockGameWorkerPort;

  function renderWorkerSendMessage<M extends Message<any>>(thread: Thread, message: M, transferList: Transferable[]) {
    if (thread === Thread.Game) {
      gameWorkerMessagePort.postMessage({ dest: thread, message }, transferList);
    } else if (thread === Thread.Main) {
      workerScope.postMessage({ dest: thread, message }, transferList);
    }
  }

  const ctx: RenderThreadState = {
    thread: Thread.Render,
    canvas,
    gameToRenderTripleBufferFlags,
    renderToGameTripleBufferFlags,
    elapsed: performance.now(),
    dt: 0,
    messageHandlers: new Map(),
    systems: renderConfig.systems,
    modules: new Map(),
    sendMessage: renderWorkerSendMessage,
    // TODO: figure out how to create the main thread context such that this is initially set
    worldResource: undefined as any,
    isStaleFrame: false,
    tick: 0,
    singleConsumerThreadSharedState,
  };

  const onMessage = ({ data }: MessageEvent) => {
    if (typeof data !== "object") {
      return;
    }

    const { message, dest } = data;

    if (dest !== Thread.Render) {
      return;
    }

    const handlers = ctx.messageHandlers.get(message.type);

    if (handlers) {
      for (const handler of handlers) {
        handler(ctx, message);
      }
    }
  };

  workerScope.addEventListener("message", onMessage as any);
  gameWorkerMessagePort.addEventListener("message", onMessage);

  const modulePromise = registerModules(Thread.Render, ctx, renderConfig.modules);

  gameWorkerMessagePort.start();

  await modulePromise;

  ctx.worldResource = await waitUntil(() => {
    ResourceLoaderSystem(ctx);
    return getLocalResources(ctx, RenderWorld)[0];
  });

  console.log("RenderWorker initialized");

  startRenderLoop(ctx);
}
