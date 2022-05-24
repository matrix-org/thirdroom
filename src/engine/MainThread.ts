import GameWorker from "./GameWorker?worker";
import { createResourceManagerBuffer } from "./resources/ResourceManager";
import { createTripleBuffer } from "./allocator/TripleBuffer";
import {
  GameWorkerInitializedMessage,
  RenderWorkerInitializedMessage,
  WorkerMessages,
  WorkerMessageType,
  PostMessageTarget,
  InitializeGameWorkerMessage,
  InitializeRenderWorkerMessage,
} from "./WorkerMessage";
import { BaseThreadContext, Message, registerModules } from "./module/module.common";
import mainThreadConfig from "./config.main";

export type MainThreadSystem = (state: IMainThreadContext) => void;

export interface IMainThreadContext extends BaseThreadContext {
  canvas: HTMLCanvasElement;
  animationFrameId?: number;
  gameWorker: Worker;
  renderWorker: Worker;
  initialGameWorkerState: { [key: string]: any };
  initialRenderWorkerState: { [key: string]: any };
}

export type IInitialMainThreadState = {};

export async function MainThread(canvas: HTMLCanvasElement) {
  const gameWorker = new GameWorker();

  const {
    renderWorker,
    canvasTarget,
    renderWorkerMessageTarget,
    gameWorkerMessageTarget,
    dispose: disposeRenderWorker,
  } = await initRenderWorker(canvas, gameWorker);

  const context: IMainThreadContext = {
    systems: new Map(),
    modules: new Map(),
    canvas,
    gameWorker,
    renderWorker,
    messageHandlers: new Map(),
    initialGameWorkerState: {},
    initialRenderWorkerState: {},
  };

  const renderableTripleBuffer = createTripleBuffer();

  const resourceManagerBuffer = createResourceManagerBuffer();

  const renderWorkerMessagePort =
    renderWorkerMessageTarget instanceof MessagePort ? renderWorkerMessageTarget : undefined;

  /* Initialize all modules and retrieve data needed to send to workers */

  const disposeModules = await registerModules({}, context, mainThreadConfig.modules);

  /* Wait for workers to be ready */

  await new Promise<RenderWorkerInitializedMessage>((resolve, reject) => {
    renderWorker.postMessage(
      {
        type: WorkerMessageType.InitializeRenderWorker,
        renderableTripleBuffer,
        gameWorkerMessageTarget,
        canvasTarget,
        initialCanvasWidth: context.canvas.clientWidth,
        initialCanvasHeight: context.canvas.clientHeight,
        resourceManagerBuffer,
        initialRenderWorkerState: context.initialRenderWorkerState,
      } as InitializeRenderWorkerMessage,
      gameWorkerMessageTarget instanceof MessagePort && canvasTarget instanceof OffscreenCanvas
        ? [gameWorkerMessageTarget, canvasTarget]
        : undefined
    );

    const onMessage = ({ data }: any): void => {
      if (data.type === WorkerMessageType.RenderWorkerInitialized) {
        resolve(data);
        renderWorker.removeEventListener("message", onMessage);
      } else if (data.type === WorkerMessageType.RenderWorkerError) {
        reject(data.error);
        renderWorker.removeEventListener("message", onMessage);
      }
    };

    renderWorker.addEventListener("message", onMessage);
  });

  await new Promise<GameWorkerInitializedMessage>((resolve, reject) => {
    context.gameWorker.postMessage(
      {
        type: WorkerMessageType.InitializeGameWorker,
        renderableTripleBuffer,
        renderWorkerMessagePort,
        resourceManagerBuffer,
        initialGameWorkerState: context.initialGameWorkerState,
      } as InitializeGameWorkerMessage,
      renderWorkerMessagePort ? [renderWorkerMessagePort] : undefined
    );

    const onMessage = ({ data }: { data: WorkerMessages }): void => {
      if (data.type === WorkerMessageType.GameWorkerInitialized) {
        resolve(data);
        context.gameWorker.removeEventListener("message", onMessage);
      } else if (data.type === WorkerMessageType.GameWorkerError) {
        reject(data.error);
        context.gameWorker.removeEventListener("message", onMessage);
      }
    };

    context.gameWorker.addEventListener("message", onMessage);
  });

  function onWorkerMessage(event: MessageEvent<Message<any>>) {
    const handlers = context.messageHandlers.get(event.data.type);

    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i](context, event.data);
      }
    }
  }

  context.gameWorker.addEventListener("message", onWorkerMessage);
  renderWorker.addEventListener("message", onWorkerMessage);

  /* Start Workers */

  renderWorker.postMessage({
    type: WorkerMessageType.StartRenderWorker,
  });

  context.gameWorker.postMessage({
    type: WorkerMessageType.StartGameWorker,
  });

  /* Update loop for input manager */

  function update() {
    const systems = mainThreadConfig.systems;

    for (let i = 0; i < systems.length; i++) {
      systems[i](context);
    }

    context.animationFrameId = requestAnimationFrame(update);
  }

  update();

  return {
    context,
    dispose() {
      if (context.animationFrameId !== undefined) {
        cancelAnimationFrame(context.animationFrameId);
      }

      disposeModules();

      context.gameWorker.removeEventListener("message", onWorkerMessage);
      renderWorker.removeEventListener("message", onWorkerMessage);

      context.gameWorker.terminate();
      disposeRenderWorker();
    },
  };
}

async function initRenderWorker(canvas: HTMLCanvasElement, gameWorker: Worker) {
  const supportsOffscreenCanvas = !!window.OffscreenCanvas;

  let renderWorker: Worker;
  let canvasTarget: HTMLCanvasElement | OffscreenCanvas;
  let renderWorkerMessageTarget: PostMessageTarget;
  let gameWorkerMessageTarget: PostMessageTarget;

  if (supportsOffscreenCanvas) {
    console.info("Browser supports OffscreenCanvas, rendering in WebWorker.");
    const { default: RenderWorker } = await import("./RenderWorker?worker");
    renderWorker = new RenderWorker();
    canvasTarget = canvas.transferControlToOffscreen();
    const interWorkerChannel = new MessageChannel();
    renderWorkerMessageTarget = interWorkerChannel.port1;
    gameWorkerMessageTarget = interWorkerChannel.port2;
  } else {
    console.info("Browser does not support OffscreenCanvas, rendering on main thread.");
    const result = await import("./RenderWorker");
    renderWorker = result.default as Worker;
    renderWorkerMessageTarget = result.default;
    gameWorkerMessageTarget = gameWorker;
    canvasTarget = canvas;
  }

  function onResize() {
    renderWorker.postMessage({
      type: WorkerMessageType.RenderWorkerResize,
      canvasWidth: canvas.clientWidth,
      canvasHeight: canvas.clientHeight,
    });
  }

  window.addEventListener("resize", onResize);

  return {
    renderWorker,
    canvasTarget,
    renderWorkerMessageTarget,
    gameWorkerMessageTarget,
    dispose() {
      window.removeEventListener("resize", onResize);

      if (renderWorker instanceof Worker) {
        renderWorker.terminate();
      }
    },
  };
}

export function sendWorldJoinedMessage(state: IMainThreadContext, joined: boolean) {
  state.gameWorker.postMessage({
    type: WorkerMessageType.StateChanged,
    state: {
      joined,
    },
  });
}
