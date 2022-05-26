import { addEntity, createWorld } from "bitecs";

import { addChild, addTransformComponent } from "./component/transform";
import { maxEntities, tickRate } from "./config.common";
import {
  InitializeGameWorkerMessage,
  WorkerMessages,
  WorkerMessageType,
  GameWorkerInitializedMessage,
  GameWorkerErrorMessage,
} from "./WorkerMessage";
import { exportGLTF } from "./gltf/exportGLTF";
import { registerDefaultPrefabs } from "./prefab";
import { registerModules } from "./module/module.common";
import gameConfig from "./config.game";
import { GameState, IInitialGameThreadState, RenderState, World } from "./GameTypes";

const workerScope = globalThis as typeof globalThis & Worker;

async function onInitMessage({ data }: { data: WorkerMessages }) {
  if (typeof data !== "object") {
    return;
  }

  const message = data as WorkerMessages;

  if (message.type === WorkerMessageType.InitializeGameWorker) {
    workerScope.removeEventListener("message", onInitMessage);

    try {
      await onInit(message);

      postMessage({
        type: WorkerMessageType.GameWorkerInitialized,
      } as GameWorkerInitializedMessage);
    } catch (error) {
      postMessage({
        type: WorkerMessageType.GameWorkerError,
        error,
      } as GameWorkerErrorMessage);
    }
  }
}

workerScope.addEventListener("message", onInitMessage);

const onMessage =
  (state: GameState) =>
  ({ data }: any) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    const handlers = state.messageHandlers.get(message.type);

    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i](state, message);
      }
      return;
    }

    // TODO: This switch statement is doing a lot of heavy lifting. Move to the message handler map above.
    switch (message.type) {
      case WorkerMessageType.StartGameWorker:
        onStart(state);
        break;

      case WorkerMessageType.ExportScene:
        exportGLTF(state, state.scene);
        break;
    }
  };

async function onInit({
  renderWorkerMessagePort,
  initialGameWorkerState,
}: InitializeGameWorkerMessage): Promise<GameState> {
  if (renderWorkerMessagePort) {
    renderWorkerMessagePort.start();
  }

  const { renderableTripleBuffer } = initialGameWorkerState as IInitialGameThreadState;
  const renderPort = renderWorkerMessagePort || workerScope;

  const world = createWorld<World>(maxEntities);

  // noop entity
  addEntity(world);

  const scene = addEntity(world);
  addTransformComponent(world, scene);

  const camera = addEntity(world);
  addTransformComponent(world, camera);
  addChild(scene, camera);

  const renderer: RenderState = {
    tripleBuffer: renderableTripleBuffer,
    port: renderPort,
  };

  const state: GameState = {
    elapsed: performance.now(),
    dt: 0,
    world,
    scene,
    camera,
    prefabTemplateMap: new Map(),
    entityPrefabMap: new Map(),
    renderer,
    systems: gameConfig.systems,
    messageHandlers: new Map(),
    modules: new Map(),
  };

  workerScope.addEventListener("message", onMessage(state));

  if (renderWorkerMessagePort) {
    renderWorkerMessagePort.addEventListener("message", onMessage(state));
  }

  await registerModules(
    {
      renderPort,
      ...initialGameWorkerState,
    },
    state,
    gameConfig.modules
  );

  registerDefaultPrefabs(state);

  return state;
}

function onStart(state: GameState) {
  update(state);
}

// timeoutOffset: ms to subtract from the dynamic timeout to make sure we are always updating around 60hz
// ex. Our game loop should be called every 16.666ms, it took 3ms this frame.
// We could schedule the timeout for 13.666ms, but it would likely be scheduled about  3ms later.
// So subtract 3-4ms from that timeout to make sure it always swaps the buffers in under 16.666ms.
const timeoutOffset = 4;

function update(state: GameState) {
  for (let i = 0; i < state.systems.length; i++) {
    state.systems[i](state);
  }

  const frameDuration = performance.now() - state.elapsed;
  const remainder = Math.max(1000 / tickRate - frameDuration - timeoutOffset, 0);
  setTimeout(() => update(state), remainder);
}
