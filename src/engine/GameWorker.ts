import * as RAPIER from "@dimforge/rapier3d-compat";
import { addEntity, createWorld, IWorld } from "bitecs";

import { addTransformComponent, updateMatrixWorld } from "./component/transform";
import { createCursorBuffer } from "./allocator/CursorBuffer";
import { maxEntities, NOOP, tickRate } from "./config";
import {
  RemoteResourceManager,
  createRemoteResourceManager,
  remoteResourceDisposed,
  remoteResourceLoaded,
  remoteResourceLoadError,
} from "./resources/RemoteResourceManager";
import { copyToWriteBuffer, getReadBufferIndex, swapWriteBuffer, TripleBufferState } from "./TripleBuffer";
import { createInputState, InputState, InputStateGetters } from "./input/InputManager";
import {
  InitializeGameWorkerMessage,
  WorkerMessages,
  WorkerMessageType,
  GameWorkerInitializedMessage,
  GameWorkerErrorMessage,
} from "./WorkerMessage";
import { ActionState, ActionMap } from "./input/ActionMappingSystem";
import { inputReadSystem } from "./input/inputReadSystem";
import { renderableBuffer } from "./component";
import { init } from "../game";
import { createStatsBuffer, StatsBuffer, writeGameWorkerStats } from "./stats";
import { exportGLTF } from "./gltf/exportGLTF";

const workerScope = globalThis as typeof globalThis & Worker;

const onMessage =
  (state: GameState) =>
  ({ data }: any) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    switch (message.type) {
      case WorkerMessageType.StartGameWorker:
        onStart(state);
        break;
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

async function onInitMessage({ data }: { data: WorkerMessages }) {
  if (typeof data !== "object") {
    return;
  }

  const message = data as WorkerMessages;

  if (message.type === WorkerMessageType.InitializeGameWorker) {
    try {
      if (message.renderWorkerMessagePort) {
        message.renderWorkerMessagePort.start();
      }

      const state = await onInit(message);

      postMessage({
        type: WorkerMessageType.GameWorkerInitialized,
      } as GameWorkerInitializedMessage);

      workerScope.addEventListener("message", onMessage(state));

      if (message.renderWorkerMessagePort) {
        message.renderWorkerMessagePort.addEventListener("message", onMessage(state));
      }
    } catch (error) {
      postMessage({
        type: WorkerMessageType.GameWorkerError,
        error,
      } as GameWorkerErrorMessage);
    }

    workerScope.removeEventListener("message", onInitMessage);
  }
}

workerScope.addEventListener("message", onInitMessage);

export type World = IWorld;

export interface TimeState {
  elapsed: number;
  dt: number;
}

export type RenderPort = MessagePort | (typeof globalThis & Worker);

export interface RenderState {
  tripleBuffer: TripleBufferState;
  port: RenderPort;
}

export interface NetworkState {
  messages: ArrayBuffer[];
  idMap: Map<number, number>;
  clientId: number;
  localIdCount: number;
  removedLocalIds: number[];
}

export interface GameInputState {
  tripleBuffer: TripleBufferState;
  inputStates: InputState[];
  actions: Map<string, ActionState>;
  actionMaps: ActionMap[];
  raw: { [path: string]: number };
}

export type System = (state: GameState) => void;

export interface GameState {
  world: World;
  physicsWorld: RAPIER.World;
  renderer: RenderState;
  time: TimeState;
  resourceManager: RemoteResourceManager;
  input: GameInputState;
  systems: System[];
  scene: number;
  camera: number;
  statsBuffer: StatsBuffer;
  network: NetworkState;
}

const generateInputGetters = (
  inputStates: InputState[],
  inputTripleBuffer: TripleBufferState
): { [path: string]: number } =>
  Object.defineProperties(
    {},
    Object.fromEntries(
      Object.entries(InputStateGetters).map(([path, getter]) => [
        path,
        { enumerable: true, get: () => getter(inputStates[getReadBufferIndex(inputTripleBuffer)]) },
      ])
    )
  );

async function onInit({
  inputTripleBuffer,
  resourceManagerBuffer,
  renderWorkerMessagePort,
  renderableTripleBuffer,
  statsSharedArrayBuffer,
}: InitializeGameWorkerMessage): Promise<GameState> {
  const renderPort = renderWorkerMessagePort || workerScope;

  const statsBuffer = createStatsBuffer(statsSharedArrayBuffer);

  const world = createWorld<World>(maxEntities);

  // noop entity
  addEntity(world);

  const scene = addEntity(world);
  addTransformComponent(world, scene);

  const camera = addEntity(world);
  addTransformComponent(world, camera);

  await RAPIER.init();

  const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
  const physicsWorld = new RAPIER.World(gravity);

  const inputStates = inputTripleBuffer.buffers
    .map((buffer) => createCursorBuffer(buffer))
    .map((buffer) => createInputState(buffer));

  const resourceManager = createRemoteResourceManager(resourceManagerBuffer, renderPort);

  const renderer: RenderState = {
    tripleBuffer: renderableTripleBuffer,
    port: renderPort,
  };

  const input: GameInputState = {
    tripleBuffer: inputTripleBuffer,
    inputStates,
    actions: new Map(),
    actionMaps: [],
    raw: generateInputGetters(inputStates, inputTripleBuffer),
  };

  const time: TimeState = {
    elapsed: performance.now(),
    dt: 0,
  };

  const network: NetworkState = {
    messages: [],
    idMap: new Map<number, number>(),
    // todo: use mxid as clientId
    clientId: NOOP,
    localIdCount: 0,
    removedLocalIds: [],
  };

  const state: GameState = {
    world,
    scene,
    camera,
    resourceManager,
    renderer,
    physicsWorld,
    input,
    time,
    network,
    systems: [],
    statsBuffer,
  };

  await init(state);

  return state;
}

function onStart(state: GameState) {
  update(state);
}

const updateWorldMatrixSystem = (state: GameState) => {
  updateMatrixWorld(state.scene);
};

const renderableTripleBufferSystem = ({ renderer }: GameState) => {
  copyToWriteBuffer(renderer.tripleBuffer, renderableBuffer);
  swapWriteBuffer(renderer.tripleBuffer);
};

const timeSystem = ({ time }: GameState) => {
  const now = performance.now();
  time.dt = (now - time.elapsed) / 1000;
  time.elapsed = now;
};

const pipeline = (state: GameState) => {
  timeSystem(state);
  inputReadSystem(state);

  for (let i = 0; i < state.systems.length; i++) {
    state.systems[i](state);
  }

  updateWorldMatrixSystem(state);
  renderableTripleBufferSystem(state);
};

// timeoutOffset: ms to subtract from the dynamic timeout to make sure we are always updating around 60hz
// ex. Our game loop should be called every 16.666ms, it took 3ms this frame.
// We could schedule the timeout for 13.666ms, but it would likely be scheduled about  3ms later.
// So subtract 3-4ms from that timeout to make sure it always swaps the buffers in under 16.666ms.
const timeoutOffset = 4;

function update(state: GameState) {
  pipeline(state);

  const frameDuration = performance.now() - state.time.elapsed;
  const remainder = Math.max(1000 / tickRate - frameDuration - timeoutOffset, 0);

  writeGameWorkerStats(state, frameDuration);

  setTimeout(() => update(state), remainder);
}
