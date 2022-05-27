import GameWorker from "./GameWorker?worker";
import {
  WorkerMessageType,
  PostMessageTarget,
  InitializeGameWorkerMessage,
  InitializeRenderWorkerMessage,
} from "./WorkerMessage";
import { BaseThreadContext, Message, registerMessageHandler, registerModules, Thread } from "./module/module.common";
import mainThreadConfig from "./config.main";
import { swapReadBufferFlags, swapWriteBufferFlags } from "./allocator/TripleBuffer";

export type MainThreadSystem = (state: IMainThreadContext) => void;

export interface IMainThreadContext extends BaseThreadContext {
  mainToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  canvas: HTMLCanvasElement;
  animationFrameId?: number;
  gameWorker: Worker;
  renderWorker: Worker;
  initialGameWorkerState: { [key: string]: any };
  initialRenderWorkerState: { [key: string]: any };
}

export async function MainThread(canvas: HTMLCanvasElement) {
  const gameWorker = new GameWorker();

  const {
    renderWorker,
    renderWorkerMessageTarget,
    gameWorkerMessageTarget,
    dispose: disposeRenderWorker,
  } = await initRenderWorker(canvas, gameWorker);

  function mainThreadSendMessage<M extends Message<any>>(thread: Thread, message: M, transferList?: Transferable[]) {
    if (thread === Thread.Game) {
      gameWorker.postMessage(message, transferList);
    } else if (thread === Thread.Render) {
      renderWorker.postMessage(message, transferList);
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
    canvas,
    gameWorker,
    renderWorker,
    messageHandlers: new Map(),
    initialGameWorkerState: {},
    initialRenderWorkerState: {},
    sendMessage: mainThreadSendMessage,
  };

  const renderWorkerMessagePort =
    renderWorkerMessageTarget instanceof MessagePort ? renderWorkerMessageTarget : undefined;

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

  /* Initialize workers */

  let onGameWorkerInitialized: (...args: any[]) => void;
  let onRenderWorkerInitialized: (...args: any[]) => void;

  const gameWorkerInitialized = new Promise((resolve) => {
    onGameWorkerInitialized = resolve;
  });
  const renderWorkerInitialized = new Promise((resolve) => {
    onRenderWorkerInitialized = resolve;
  });

  registerMessageHandler(context, WorkerMessageType.GameWorkerInitialized, () => {
    onGameWorkerInitialized();
  });
  registerMessageHandler(context, WorkerMessageType.RenderWorkerInitialized, () => {
    onRenderWorkerInitialized();
  });

  context.sendMessage(
    Thread.Game,
    {
      type: WorkerMessageType.InitializeGameWorker,
      renderWorkerMessagePort,
      mainToGameTripleBufferFlags,
      gameToMainTripleBufferFlags,
      gameToRenderTripleBufferFlags,
    } as InitializeGameWorkerMessage,
    renderWorkerMessagePort ? [renderWorkerMessagePort] : undefined
  );

  context.sendMessage(
    Thread.Render,
    {
      type: WorkerMessageType.InitializeRenderWorker,
      gameWorkerMessageTarget,
      gameToRenderTripleBufferFlags,
    } as InitializeRenderWorkerMessage,
    gameWorkerMessageTarget instanceof MessagePort ? [gameWorkerMessageTarget] : undefined
  );

  await Promise.all([gameWorkerInitialized, renderWorkerInitialized]);

  /* Initialize all modules and retrieve data needed to send to workers */

  const disposeModules = await registerModules(context, mainThreadConfig.modules);

  /* Wait for other threads to have registered their modules */

  let onGameWorkerModulesRegistered: (...args: any[]) => void;
  let onRenderWorkerModulesRegistered: (...args: any[]) => void;

  const gameWorkerModulesRegistered = new Promise((resolve) => {
    onGameWorkerModulesRegistered = resolve;
  });
  const renderWorkerModulesRegistered = new Promise((resolve) => {
    onRenderWorkerModulesRegistered = resolve;
  });

  registerMessageHandler(context, "game-worker-modules-registered", () => {
    onGameWorkerModulesRegistered();
  });
  registerMessageHandler(context, "render-worker-modules-registered", () => {
    onRenderWorkerModulesRegistered();
  });

  await Promise.all([gameWorkerModulesRegistered, renderWorkerModulesRegistered]);

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
  let renderWorkerMessageTarget: PostMessageTarget;
  let gameWorkerMessageTarget: PostMessageTarget;

  if (supportsOffscreenCanvas) {
    console.info("Browser supports OffscreenCanvas, rendering in WebWorker.");
    const { default: RenderWorker } = await import("./RenderWorker?worker");
    renderWorker = new RenderWorker();
    const interWorkerChannel = new MessageChannel();
    renderWorkerMessageTarget = interWorkerChannel.port1;
    gameWorkerMessageTarget = interWorkerChannel.port2;
  } else {
    console.info("Browser does not support OffscreenCanvas, rendering on main thread.");
    const result = await import("./RenderWorker");
    renderWorker = result.default as Worker;
    renderWorkerMessageTarget = result.default;
    gameWorkerMessageTarget = gameWorker;
  }

  return {
    renderWorker,
    renderWorkerMessageTarget,
    gameWorkerMessageTarget,
    dispose() {
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
