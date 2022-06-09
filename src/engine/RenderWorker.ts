import { InitializeRenderWorkerMessage, WorkerMessages, WorkerMessageType } from "./WorkerMessage";
import { Message, registerModules, Thread } from "./module/module.common";
import renderConfig from "./config.render";
import { RenderThreadState, startRenderLoop } from "./renderer/renderer.render";

// TODO: Figure out how to import this type without polluting global scope and causing issues with Window
type DedicatedWorkerGlobalScope = any;

export default function initRenderWorkerOnMainThread(canvas: HTMLCanvasElement) {
  const messageChannel = new MessageChannel();
  startRenderWorker(messageChannel.port1, canvas);
  messageChannel.port1.start();
  messageChannel.port2.start();
  return messageChannel.port2;
}

const isWorker = typeof (window as any) === "undefined";

if (isWorker) {
  startRenderWorker(self as DedicatedWorkerGlobalScope);
}

function startRenderWorker(workerScope: DedicatedWorkerGlobalScope | MessagePort, canvas?: HTMLCanvasElement) {
  const onInitMessage = (event: MessageEvent<WorkerMessages>) => {
    if (typeof event.data !== "object") {
      return;
    }

    const message = event.data;

    if (message.type === WorkerMessageType.InitializeRenderWorker) {
      workerScope.removeEventListener("message", onInitMessage as any);
      onInit(workerScope, message, canvas);
    }
  };

  workerScope.addEventListener("message", onInitMessage as any);
}

async function onInit(
  workerScope: DedicatedWorkerGlobalScope | MessagePort,
  { gameWorkerMessageTarget, gameToRenderTripleBufferFlags }: InitializeRenderWorkerMessage,
  canvas?: HTMLCanvasElement
) {
  function renderWorkerSendMessage<M extends Message<any>>(thread: Thread, message: M, transferList: Transferable[]) {
    if (thread === Thread.Game) {
      gameWorkerMessageTarget.postMessage(message, transferList);
    } else if (thread === Thread.Main) {
      workerScope.postMessage(message, transferList);
    }
  }

  const state: RenderThreadState = {
    canvas,
    gameToRenderTripleBufferFlags,
    elapsed: performance.now(),
    dt: 0,
    gameWorkerMessageTarget,
    messageHandlers: new Map(),
    systems: [],
    modules: new Map(),
    sendMessage: renderWorkerSendMessage,
  };

  const onMessage = ({ data }: MessageEvent<WorkerMessages>) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data;

    const handlers = state.messageHandlers.get(message.type);

    if (handlers) {
      for (const handler of handlers) {
        handler(state, message);
      }
    }
  };

  workerScope.addEventListener("message", onMessage as any);
  gameWorkerMessageTarget.addEventListener("message", onMessage);

  const modulePromise = registerModules(Thread.Render, state, renderConfig.modules);

  gameWorkerMessageTarget.start();

  await modulePromise;

  console.log("RenderWorker initialized");

  startRenderLoop(state);
}
