import { addEntity, createWorld, IWorld } from "bitecs";

import { addChild, addTransformComponent, updateMatrixWorld } from "./component/transform";
import { maxEntities, tickRate } from "./config.common";
import {
  RemoteResourceManager,
  createRemoteResourceManager,
  remoteResourceDisposed,
  remoteResourceLoaded,
  remoteResourceLoadError,
} from "./resources/RemoteResourceManager";
import { copyToWriteBuffer, swapWriteBuffer, TripleBufferState } from "./allocator/TripleBuffer";
import {
  InitializeGameWorkerMessage,
  WorkerMessages,
  WorkerMessageType,
  GameWorkerInitializedMessage,
  GameWorkerErrorMessage,
} from "./WorkerMessage";
import { renderableBuffer } from "./component/buffers";
import { StatsBuffer } from "./stats/stats.common";
import { exportGLTF } from "./gltf/exportGLTF";
import { PrefabTemplate, registerDefaultPrefabs } from "./prefab";
import { BaseThreadContext, registerModules, ThreadSystem } from "./module/module.common";
import gameConfig from "./config.game";

const workerScope = globalThis as typeof globalThis & Worker;

async function onInitMessage({ data }: { data: WorkerMessages }) {
  if (typeof data !== "object") {
    return;
  }

  const message = data as WorkerMessages;

  if (message.type === WorkerMessageType.InitializeGameWorker) {
    workerScope.removeEventListener("message", onInitMessage);

    try {
      if (message.renderWorkerMessagePort) {
        message.renderWorkerMessagePort.start();
      }

      // initialize GameWorkerContext
      const state = await onInit(message);

      workerScope.addEventListener("message", onMessage(state));

      if (message.renderWorkerMessagePort) {
        message.renderWorkerMessagePort.addEventListener("message", onMessage(state));
      }

      await registerModules(message.initialGameWorkerState, state, gameConfig.modules);

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

      // resource
      case WorkerMessageType.ResourceLoaded:
        remoteResourceLoaded(state.resourceManager, message.resourceId, message.remoteResource);
        break;
      case WorkerMessageType.ResourceLoadError:
        remoteResourceLoadError(state.resourceManager, message.resourceId, message.error);
        break;
      case WorkerMessageType.ResourceDisposed:
        remoteResourceDisposed(state.resourceManager, message.resourceId);
        break;

      case WorkerMessageType.ExportScene:
        exportGLTF(state, state.scene);
        break;
    }
  };

export type World = IWorld;

export type RenderPort = MessagePort | (typeof globalThis & Worker);

export interface RenderState {
  tripleBuffer: TripleBufferState;
  port: RenderPort;
}

export interface TimeState {
  elapsed: number;
  dt: number;
}

export interface GameState extends BaseThreadContext {
  world: World;
  renderer: RenderState;
  time: TimeState;
  resourceManager: RemoteResourceManager;
  prefabTemplateMap: Map<string, PrefabTemplate>;
  entityPrefabMap: Map<number, string>;
  systems: Map<ThreadSystem<GameState>, boolean>;
  scene: number;
  camera: number;
}

export interface IInitialGameThreadState {
  inputTripleBuffer: TripleBufferState;
  audioTripleBuffer: TripleBufferState;
  hierarchyTripleBuffer: TripleBufferState;
  statsBuffer: StatsBuffer;
}

async function onInit({
  resourceManagerBuffer,
  renderWorkerMessagePort,
  renderableTripleBuffer,
}: InitializeGameWorkerMessage): Promise<GameState> {
  const renderPort = renderWorkerMessagePort || workerScope;

  const world = createWorld<World>(maxEntities);

  // noop entity
  addEntity(world);

  const scene = addEntity(world);
  addTransformComponent(world, scene);

  const camera = addEntity(world);
  addTransformComponent(world, camera);
  addChild(scene, camera);

  const resourceManager = createRemoteResourceManager(resourceManagerBuffer, renderPort);

  const renderer: RenderState = {
    tripleBuffer: renderableTripleBuffer,
    port: renderPort,
  };

  const time: TimeState = {
    elapsed: performance.now(),
    dt: 0,
  };

  const state: GameState = {
    world,
    scene,
    camera,
    resourceManager,
    prefabTemplateMap: new Map(),
    entityPrefabMap: new Map(),
    renderer,
    time,
    systems: new Map(),
    messageHandlers: new Map(),
    modules: new Map(),
  };

  registerDefaultPrefabs(state);

  return state;
}

function onStart(state: GameState) {
  update(state);
}

export function TimeSystem(state: GameState) {
  const now = performance.now();
  state.time.dt = (now - state.time.elapsed) / 1000;
  state.time.elapsed = now;
}

export const UpdateWorldMatrixSystem = (state: GameState) => {
  updateMatrixWorld(state.scene);
};

export const RenderableTripleBufferSystem = ({ renderer }: GameState) => {
  copyToWriteBuffer(renderer.tripleBuffer, renderableBuffer);
  swapWriteBuffer(renderer.tripleBuffer);
};

// timeoutOffset: ms to subtract from the dynamic timeout to make sure we are always updating around 60hz
// ex. Our game loop should be called every 16.666ms, it took 3ms this frame.
// We could schedule the timeout for 13.666ms, but it would likely be scheduled about  3ms later.
// So subtract 3-4ms from that timeout to make sure it always swaps the buffers in under 16.666ms.
const timeoutOffset = 4;

function update(state: GameState) {
  for (let i = 0; i < gameConfig.systems.length; i++) {
    gameConfig.systems[i](state);
  }

  const frameDuration = performance.now() - state.time.elapsed;
  const remainder = Math.max(1000 / tickRate - frameDuration - timeoutOffset, 0);
  setTimeout(() => update(state), remainder);
}
