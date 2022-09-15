import { InitializeRenderWorkerMessage, WorkerMessageType } from "./WorkerMessage";
import { Message, registerModules, Thread } from "./module/module.common";
import renderConfig from "./config.render";
import { RenderThreadState, startRenderLoop } from "./renderer/renderer.render";
import { MockMessageChannel, MockWorkerMessageChannel, MockMessagePort } from "./module/MockMessageChannel";

// TODO: Figure out how to import this type without polluting global scope and causing issues with Window
type DedicatedWorkerGlobalScope = any;

export default function initRenderWorkerOnMainThread(canvas: HTMLCanvasElement, gameWorker: Worker) {
  const renderGameMessageChannel = new MockWorkerMessageChannel(gameWorker);
  const rendererMainMessageChannel = new MockMessageChannel();
  startRenderWorker(rendererMainMessageChannel.port1, canvas, renderGameMessageChannel.port1);
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
  mockGameWorkerPort?: MockMessagePort
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
      onInit(workerScope, message, canvas, mockGameWorkerPort);
    }
  };

  workerScope.addEventListener("message", onInitMessage as any);
}

async function onInit(
  workerScope: DedicatedWorkerGlobalScope | MessagePort,
  { gameWorkerMessageTarget, gameToRenderTripleBufferFlags }: InitializeRenderWorkerMessage,
  canvas?: HTMLCanvasElement,
  mockGameWorkerPort?: MockMessagePort
) {
  const gameWorkerMessagePort = gameWorkerMessageTarget || mockGameWorkerPort;

  function renderWorkerSendMessage<M extends Message<any>>(thread: Thread, message: M, transferList: Transferable[]) {
    if (thread === Thread.Game) {
      gameWorkerMessagePort.postMessage({ dest: thread, message }, transferList);
    } else if (thread === Thread.Main) {
      workerScope.postMessage({ dest: thread, message }, transferList);
    }
  }

  const state: RenderThreadState = {
    canvas,
    gameToRenderTripleBufferFlags,
    elapsed: performance.now(),
    dt: 0,
    messageHandlers: new Map(),
    systems: renderConfig.systems,
    modules: new Map(),
    sendMessage: renderWorkerSendMessage,
  };

  const onMessage = ({ data }: MessageEvent) => {
    if (typeof data !== "object") {
      return;
    }

    const { message, dest } = data;

    if (dest !== Thread.Render) {
      return;
    }

    const handlers = state.messageHandlers.get(message.type);

    if (handlers) {
      for (const handler of handlers) {
        handler(state, message);
      }
    }
  };

  workerScope.addEventListener("message", onMessage as any);
  gameWorkerMessagePort.addEventListener("message", onMessage);

  const modulePromise = registerModules(Thread.Render, state, renderConfig.modules);

  gameWorkerMessagePort.start();

  await modulePromise;

  console.log("RenderWorker initialized");

  startRenderLoop(state);
}
