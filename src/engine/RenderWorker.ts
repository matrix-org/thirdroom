import {
  InitializeRenderWorkerMessage,
  WorkerMessages,
  WorkerMessageType,
  RenderWorkerErrorMessage,
  RenderWorkerInitializedMessage,
  PostMessageTarget,
} from "./WorkerMessage";
import { BaseThreadContext, registerModules } from "./module/module.common";
import renderConfig from "./config.render";

let localEventTarget: EventTarget | undefined;

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

export interface RenderThreadState extends BaseThreadContext {
  gameWorkerMessageTarget: PostMessageTarget;
  elapsed: number;
  dt: number;
}

let _state: RenderThreadState;

function onMessage({ data }: any) {
  if (typeof data !== "object") {
    return;
  }

  const message = data as WorkerMessages;

  if (message.type === WorkerMessageType.InitializeRenderWorker) {
    onInit(message)
      .then((s) => {
        _state = s;
        postToMainThread({ type: WorkerMessageType.RenderWorkerInitialized } as RenderWorkerInitializedMessage);
      })
      .catch((error) => {
        console.error(error);
        postToMainThread({ type: WorkerMessageType.RenderWorkerError, error } as RenderWorkerErrorMessage);
      });
    return;
  }

  if (!_state) {
    console.warn(`Render worker not initialized before processing ${message.type}`);
    return;
  }

  const handlers = _state.messageHandlers.get(message.type);

  if (handlers) {
    for (const handler of handlers) {
      handler(_state, message as any);
    }
  }
}

async function onInit({
  canvasTarget,
  initialCanvasHeight,
  initialCanvasWidth,
  gameWorkerMessageTarget,
  initialRenderWorkerState,
}: InitializeRenderWorkerMessage): Promise<RenderThreadState> {
  gameWorkerMessageTarget.addEventListener("message", onMessage);

  if (gameWorkerMessageTarget instanceof MessagePort) {
    gameWorkerMessageTarget.start();
  }

  const state: RenderThreadState = {
    elapsed: performance.now(),
    dt: 0,
    gameWorkerMessageTarget,
    messageHandlers: new Map(),
    systems: renderConfig.systems,
    modules: new Map(),
  };

  await registerModules(
    { ...initialRenderWorkerState, gameWorkerMessageTarget, canvasTarget, initialCanvasHeight, initialCanvasWidth },
    state,
    renderConfig.modules
  );

  console.log("RenderWorker initialized");

  return state;
}
