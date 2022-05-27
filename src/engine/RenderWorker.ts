import {
  InitializeRenderWorkerMessage,
  WorkerMessages,
  WorkerMessageType,
  RenderWorkerInitializedMessage,
} from "./WorkerMessage";
import { Message, registerModules, Thread } from "./module/module.common";
import renderConfig from "./config.render";
import { RenderThreadState } from "./renderer/renderer.render";

let localEventTarget: EventTarget | undefined;

let onMessage = ({ data }: any) => {
  if (typeof data !== "object") {
    return;
  }

  const message = data as WorkerMessages;

  if (message.type === WorkerMessageType.InitializeRenderWorker) {
    postToMainThread({ type: WorkerMessageType.RenderWorkerInitialized } as RenderWorkerInitializedMessage);
    onInit(message);
  }
};

const isWorker = typeof (window as any) === "undefined";

if (isWorker) {
  self.window = self;
  globalThis.addEventListener("message", onMessage);
} else {
  localEventTarget = new EventTarget();
}

// outbound RenderThread -> MainThread
export function postToMainThread(data: any, transfer?: (Transferable | OffscreenCanvas)[]) {
  if (isWorker) {
    (globalThis as any).postMessage(data, transfer);
  } else {
    localEventTarget!.dispatchEvent(new MessageEvent("message", { data }));
  }
}

// inbound MainThread -> RenderThread
export default {
  postMessage: (data: any) => onMessage({ data }),
  addEventListener: (
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean
  ): void => localEventTarget!.addEventListener(type, callback, options),
  removeEventListener: (
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ): void => localEventTarget!.removeEventListener(type, callback, options),
};

async function onInit({
  gameWorkerMessageTarget,
  gameToRenderTripleBufferFlags,
}: InitializeRenderWorkerMessage): Promise<RenderThreadState> {
  function renderWorkerSendMessage<M extends Message<any>>(thread: Thread, message: M, transferList: Transferable[]) {
    if (thread === Thread.Game) {
      gameWorkerMessageTarget.postMessage(message, transferList);
    } else if (thread === Thread.Main) {
      postToMainThread(message, transferList);
    }
  }

  const state: RenderThreadState = {
    gameToRenderTripleBufferFlags,
    elapsed: performance.now(),
    dt: 0,
    gameWorkerMessageTarget,
    messageHandlers: new Map(),
    systems: [],
    modules: new Map(),
    sendMessage: renderWorkerSendMessage,
  };

  onMessage = ({ data }: any) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    const handlers = state.messageHandlers.get(message.type);

    if (handlers) {
      for (const handler of handlers) {
        handler(state, message as any);
      }
    }
  };

  gameWorkerMessageTarget.addEventListener("message", onMessage);

  if (gameWorkerMessageTarget instanceof MessagePort) {
    gameWorkerMessageTarget.start();
  }

  await registerModules(state, renderConfig.modules);

  state.sendMessage(Thread.Main, { type: "render-worker-modules-registered" });

  console.log("RenderWorker initialized");

  return state;
}
