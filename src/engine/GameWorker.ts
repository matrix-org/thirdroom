import * as RAPIER from "@dimforge/rapier3d-compat";
import { addEntity, createWorld, IWorld, removeEntity } from "bitecs";

import { addChild, addTransformComponent, registerTransformComponent, updateMatrixWorld } from "./component/transform";
import { createCursorBuffer } from "./allocator/CursorBuffer";
import { maxEntities, tickRate } from "./config";
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
import { renderableBuffer } from "./component/buffers";
import { init, onStateChange } from "../game";
import { createStatsBuffer, StatsBuffer, writeGameWorkerStats } from "./stats";
import { exportGLTF } from "./gltf/exportGLTF";
import { CursorView } from "./network/CursorView";
import { createIncomingNetworkSystem, createOutgoingNetworkSystem } from "./network";
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
import { gameAudioSystem } from "./audio";
// import { NetworkTransformSystem } from "./network";

const workerScope = globalThis as typeof globalThis & Worker;

const mapPeerIdAndIndex = (state: GameState, peerId: string) => {
  const peerIdIndex = state.network.peerIdCount++;
  state.network.peerIdToIndex.set(peerId, peerIdIndex);
  state.network.indexToPeerId.set(peerIdIndex, peerId);
};

const addPeerId = (state: GameState, peerId: string) => {
  if (state.network.peers.includes(peerId) || state.network.peerId === peerId) return;

  state.network.peers.push(peerId);
  state.network.newPeers.push(peerId);
  if (state.network.hosting) mapPeerIdAndIndex(state, peerId);
};

const removePeerId = (state: GameState, peerId: string) => {
  const i = state.network.peers.indexOf(peerId);
  if (i > -1) {
    const eid = state.network.peerIdToEntityId.get(peerId);
    if (eid) removeEntity(state.world, eid);

    state.network.peers.splice(i, 1);
    state.network.peerIdToIndex.delete(peerId);
  } else {
    console.warn(`cannot remove peerId ${peerId}, does not exist in peer list`);
  }
};

const setPeerId = (state: GameState, peerId: string) => {
  state.network.peerId = peerId;
  if (state.network.hosting) mapPeerIdAndIndex(state, peerId);
};

const setHost = (state: GameState, value: boolean) => {
  state.network.hosting = value;
};

const onMessage =
  (state: GameState) =>
  ({ data }: any) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    const handler = state.messageHandlers[message.type];

    if (handler) {
      handler(state, message as any);
      return;
    }

    // TODO: This switch statement is doing a lot of heavy lifting. Move to the message handler map above.
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
      case WorkerMessageType.SetPeerId:
        setPeerId(state, message.peerId);
        break;
      case WorkerMessageType.AddPeerId:
        addPeerId(state, message.peerId);
        break;
      case WorkerMessageType.RemovePeerId:
        removePeerId(state, message.peerId);
        break;
      case WorkerMessageType.ReliableNetworkMessage:
      case WorkerMessageType.UnreliableNetworkMessage:
        state.network.incoming.push(message.packet);
        break;
      case WorkerMessageType.StateChanged:
        onStateChange(state, message.state);
        break;
      case WorkerMessageType.SetHost:
        setHost(state, message.value);
        break;
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
  hosting: boolean;
  incoming: ArrayBuffer[];
  peerIdToEntityId: Map<string, number>;
  networkIdToEntityId: Map<number, number>;
  peerId: string;
  peers: string[];
  newPeers: string[];
  peerIdCount: number;
  peerIdToIndex: Map<string, number>;
  indexToPeerId: Map<number, string>;
  localIdCount: number;
  removedLocalIds: number[];
  messageHandlers: { [key: number]: (input: [GameState, CursorView]) => void };
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
  prefabTemplateMap: Map<string, PrefabTemplate>;
  entityPrefabMap: Map<number, string>;
  input: GameInputState;
  preSystems: System[];
  systems: System[];
  postSystems: System[];
  scene: number;
  camera: number;
  statsBuffer: StatsBuffer;
  network: NetworkState;
  editorState: EditorState;
  raycaster: RaycasterState;
  messageHandlers: Partial<{ [T in WorkerMessages as T["type"]]: (gameState: GameState, message: T) => void }>;
  audio: { tripleBuffer: TripleBufferState };
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
  audioTripleBuffer,
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
  addChild(scene, camera);

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
    hosting: false,
    incoming: [],
    networkIdToEntityId: new Map<number, number>(),
    peerIdToEntityId: new Map(),
    peerId: "",
    peers: [],
    newPeers: [],
    peerIdToIndex: new Map(),
    indexToPeerId: new Map(),
    peerIdCount: 0,
    localIdCount: 0,
    removedLocalIds: [],
    messageHandlers: {},
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
    physicsWorld,
    audio,
    input,
    time,
    network,
    systems: [],
    preSystems: [],
    postSystems: [],
    statsBuffer,
    editorState: initEditorState(),
    raycaster: createRaycasterState(),
    messageHandlers: {},
  };

  initRaycaster(state);
  initEditor(state);

  registerDefaultPrefabs(state);

  // TODO: Register components in some other file.
  registerTransformComponent(state);

  state.preSystems.push(createIncomingNetworkSystem(state));

  state.postSystems.push(createOutgoingNetworkSystem(state));
  // state.postSystems.push(NetworkTransformSystem, createOutgoingNetworkSystem(state));

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

  for (let i = 0; i < state.preSystems.length; i++) {
    state.preSystems[i](state);
  }

  for (let i = 0; i < state.systems.length; i++) {
    state.systems[i](state);
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
