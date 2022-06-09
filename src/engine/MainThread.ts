import GameWorker from "./GameWorker?worker";
import { WorkerMessageType, InitializeGameWorkerMessage, InitializeRenderWorkerMessage } from "./WorkerMessage";
import { BaseThreadContext, Message, registerModules, Thread } from "./module/module.common";
import mainThreadConfig from "./config.main";
import { swapReadBufferFlags, swapWriteBufferFlags } from "./allocator/TripleBuffer";

export type MainThreadSystem = (state: IMainThreadContext) => void;

export interface IMainThreadContext extends BaseThreadContext {
  mainToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  canvas: HTMLCanvasElement;
  animationFrameId?: number;
  gameWorker: Worker;
  renderWorker: Worker | MessagePort;
  initialGameWorkerState: { [key: string]: any };
  initialRenderWorkerState: { [key: string]: any };
}

export async function MainThread(canvas: HTMLCanvasElement) {
  const gameWorker = new GameWorker();
  const renderWorker = await initRenderWorker(canvas);
  const interWorkerMessageChannel = new MessageChannel();

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

  function onWorkerMessage(event: MessageEvent<Message<any>>) {
    const handlers = context.messageHandlers.get(event.data.type);

    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i](context, event.data);
      }
    }
  }

  context.gameWorker.addEventListener("message", onWorkerMessage);
  renderWorker.addEventListener("message", onWorkerMessage as any);

  /* Register module loader event handlers before we send the message (sendMessage synchronous to RenderThread when RenderThread is running on MainThread)*/
  const moduleLoaderPromise = registerModules(Thread.Main, context, mainThreadConfig.modules);

  /* Initialize workers */

  context.sendMessage(
    Thread.Game,
    {
      type: WorkerMessageType.InitializeGameWorker,
      renderWorkerMessagePort: interWorkerMessageChannel.port1,
      mainToGameTripleBufferFlags,
      gameToMainTripleBufferFlags,
      gameToRenderTripleBufferFlags,
    } as InitializeGameWorkerMessage,
    [interWorkerMessageChannel.port1]
  );

  context.sendMessage(
    Thread.Render,
    {
      type: WorkerMessageType.InitializeRenderWorker,
      gameWorkerMessageTarget: interWorkerMessageChannel.port2,
      gameToRenderTripleBufferFlags,
    } as InitializeRenderWorkerMessage,
    [interWorkerMessageChannel.port2]
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

      context.gameWorker.removeEventListener("message", onWorkerMessage);
      renderWorker.removeEventListener("message", onWorkerMessage as any);

      context.gameWorker.terminate();

      if (renderWorker instanceof Worker) {
        renderWorker.terminate();
      }
    },
  };
}

async function initRenderWorker(canvas: HTMLCanvasElement): Promise<Worker | MessagePort> {
  const supportsOffscreenCanvas = !!window.OffscreenCanvas;

  if (supportsOffscreenCanvas) {
    console.info("Browser supports OffscreenCanvas, rendering in WebWorker.");
    const { default: RenderWorker } = await import("./RenderWorker?worker");
    return new RenderWorker();
  } else {
    console.info("Browser does not support OffscreenCanvas, rendering on main thread.");
    const { default: initRenderWorkerOnMainThread } = await import("./RenderWorker");
    return initRenderWorkerOnMainThread(canvas);
  }
}

export function sendWorldJoinedMessage(state: IMainThreadContext, joined: boolean) {
  state.gameWorker.postMessage({
    type: WorkerMessageType.StateChanged,
    state: {
      joined,
    },
  });
}
