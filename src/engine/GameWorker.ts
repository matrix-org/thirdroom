import { addEntity, createWorld } from "bitecs";

import { maxEntities, tickRate } from "./config.common";
import { InitializeGameWorkerMessage, WorkerMessageType } from "./WorkerMessage";
import { Message, registerModules, Thread } from "./module/module.common";
import gameConfig from "./config.game";
import { GameState, World } from "./GameTypes";

const workerScope = globalThis as typeof globalThis & Worker;

const isFirefox = navigator.userAgent.toLowerCase().includes("gecko/");

async function onInitMessage({ data }: MessageEvent) {
  if (typeof data !== "object") {
    return;
  }

  const { dest, message } = data;

  if (dest !== Thread.Game) {
    return;
  }

  if (message.type === WorkerMessageType.InitializeGameWorker) {
    workerScope.removeEventListener("message", onInitMessage);
    onInit(message);
  }
}

workerScope.addEventListener("message", onInitMessage);

async function onInit({
  renderWorkerMessagePort,
  mainToGameTripleBufferFlags,
  renderToGameTripleBufferFlags,
  gameToMainTripleBufferFlags,
  gameToRenderTripleBufferFlags,
}: InitializeGameWorkerMessage) {
  const renderPort = renderWorkerMessagePort || workerScope;

  const world = createWorld<World>(maxEntities);

  // noop entity
  addEntity(world);

  function gameWorkerSendMessage<M extends Message<any>>(thread: Thread, message: M, transferList: Transferable[]) {
    if (thread === Thread.Main) {
      workerScope.postMessage({ dest: thread, message }, transferList);
    } else if (thread === Thread.Render) {
      renderPort.postMessage({ dest: thread, message }, transferList);
    }
  }

  const ctx: GameState = {
    thread: Thread.Game,
    renderToGameTripleBufferFlags,
    mainToGameTripleBufferFlags,
    gameToMainTripleBufferFlags,
    gameToRenderTripleBufferFlags,
    elapsed: performance.now(),
    dt: 0,
    tick: 0,
    world,
    systems: gameConfig.systems,
    messageHandlers: new Map(),
    modules: new Map(),
    sendMessage: gameWorkerSendMessage,
    // HACK: Figure out how to create the context such that these are initially set
    resourceManager: undefined as any,
    worldResource: undefined as any,
    editorLoaded: false,
  };

  const onMessage = ({ data }: MessageEvent) => {
    if (typeof data !== "object") {
      return;
    }

    const { message, dest } = data;

    if (dest !== Thread.Game) {
      return;
    }

    const handlers = ctx.messageHandlers.get(message.type);

    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i](ctx, message);
      }
    }
  };

  workerScope.addEventListener("message", onMessage);

  if (renderWorkerMessagePort) {
    renderWorkerMessagePort.addEventListener("message", onMessage);
  }

  // Sends message to main thread saying we're ready to register modules (send modules in message)
  // Initially blocks until main thread tells game thread to register modules
  // Register all modules
  // Then wait for main thread to start this worker and we call update()
  const modulePromise = registerModules(Thread.Game, ctx, gameConfig.modules);

  if (renderWorkerMessagePort) {
    renderWorkerMessagePort.start();
  }

  await modulePromise;

  console.log("GameWorker initialized");

  let interval: any;

  const intervalGameLoop = () => {
    interval = setInterval(() => {
      const then = performance.now();
      try {
        update(ctx);
      } catch (error) {
        clearInterval(interval);
        throw error;
      }

      const elapsed = performance.now() - then;
      if (elapsed > 1000 / tickRate) {
        console.warn("game worker tick duration breached tick rate. elapsed:", elapsed);
        clearInterval(interval);
        try {
          update(ctx);
        } catch (error) {
          clearInterval(interval);
          throw error;
        }
        interval = intervalGameLoop();
      }
    }, 1000 / tickRate);
    return interval;
  };

  if (isFirefox) {
    // there is some kind of issue with firefox's setInterval
    // it causes extreme jitter when sending data to other peers
    timeoutGameLoop(ctx);
  } else {
    intervalGameLoop();
  }
}

function timeoutGameLoop(ctx: GameState) {
  // need to call setTimeout immediately, otherwise network jitter ensues
  setTimeout(() => timeoutGameLoop(ctx), 1000 / tickRate);
  update(ctx);
}

function update(ctx: GameState) {
  const now = performance.now();
  ctx.dt = (now - ctx.elapsed) / 1000;
  ctx.elapsed = now;
  ctx.tick++;

  for (let i = 0; i < ctx.systems.length; i++) {
    ctx.systems[i](ctx);
  }
}
