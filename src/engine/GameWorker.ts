import { addEntity, createWorld, IWorld } from "bitecs";

import { addChild, addTransformComponent, registerTransformComponent, updateMatrixWorld } from "./component/transform";
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
import { ActionState, ActionMap } from "./input/ActionMappingSystem";
import { renderableBuffer } from "./component/buffers";
import { init, onStateChange } from "../game";
import { StatsBuffer } from "./stats/stats.common";
import { writeGameWorkerStats } from "./stats/stats.game";
import { exportGLTF } from "./gltf/exportGLTF";
import { PrefabTemplate, registerDefaultPrefabs } from "./prefab";
import {
  EditorState,
  initEditor,
  initEditorState,
  onDisposeEditor,
  onEditorMessage,
  onLoadEditor,
} from "./editor/editor.game";
import { createRaycasterState, initRaycaster, RaycasterState } from "./raycaster/raycaster.game";
import { gameAudioSystem } from "./audio/audio.game";
import { InputState } from "./input/input.common";
import { BaseThreadContext, registerModules, updateSystemOrder } from "./module/module.common";
import * as gameConfig from "./config.game";
import { InputReadSystem } from "./input/input.game";
// import { NetworkTransformSystem } from "./network";

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

      await init(state);

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

      case WorkerMessageType.StateChanged:
        onStateChange(state, message.state);
        break;

      // editor
      case WorkerMessageType.LoadEditor:
        onLoadEditor(state);
        break;
      case WorkerMessageType.DisposeEditor:
        onDisposeEditor(state);
        break;
      case WorkerMessageType.SetComponentProperty:
      case WorkerMessageType.RemoveComponent:
        onEditorMessage(state, message);
        break;
    }
  };

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

export interface GameInputState {
  tripleBuffer: TripleBufferState;
  inputStates: InputState[];
  actions: Map<string, ActionState>;
  actionMaps: ActionMap[];
  raw: { [path: string]: number };
}

export type System = (state: GameState) => void;

export interface GameState extends BaseThreadContext {
  world: World;
  renderer: RenderState;
  time: TimeState;
  resourceManager: RemoteResourceManager;
  prefabTemplateMap: Map<string, PrefabTemplate>;
  entityPrefabMap: Map<number, string>;
  preSystems: System[];
  systems: System[];
  postSystems: System[];
  scene: number;
  camera: number;
  statsBuffer: StatsBuffer;
  editorState: EditorState;
  raycaster: RaycasterState;
  audio: { tripleBuffer: TripleBufferState };
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
  initialGameWorkerState,
}: InitializeGameWorkerMessage): Promise<GameState> {
  const { audioTripleBuffer, hierarchyTripleBuffer, statsBuffer } = initialGameWorkerState as IInitialGameThreadState;

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

  const audio = {
    tripleBuffer: audioTripleBuffer,
  };

  const state: GameState = {
    world,
    scene,
    camera,
    resourceManager,
    prefabTemplateMap: new Map(),
    entityPrefabMap: new Map(),
    renderer,
    audio,
    time,
    systemGraphChanged: true,
    systemGraph: [],
    systems: [],
    preSystems: [],
    postSystems: [],
    statsBuffer,
    editorState: initEditorState(hierarchyTripleBuffer),
    raycaster: createRaycasterState(),
    messageHandlers: new Map(),
    modules: new Map(),
  };

  initRaycaster(state);
  initEditor(state);

  registerDefaultPrefabs(state);

  // TODO: Register components in some other file.
  registerTransformComponent(state);

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
  InputReadSystem(state);

  for (let i = 0; i < state.preSystems.length; i++) {
    state.preSystems[i](state);
  }

  const systems = updateSystemOrder(state);

  for (let i = 0; i < systems.length; i++) {
    systems[i](state);
  }

  for (let i = 0; i < state.postSystems.length; i++) {
    state.postSystems[i](state);
  }

  updateWorldMatrixSystem(state);
  renderableTripleBufferSystem(state);
  gameAudioSystem(state);
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
