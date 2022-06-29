import {
  addComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  Not,
  pipe,
  removeEntity,
  defineComponent,
  Types,
} from "bitecs";

import {
  createCursorView,
  CursorView,
  moveCursorView,
  readFloat32,
  readString,
  readUint16,
  readUint32,
  readUint8,
  rewindCursorView,
  scrollCursorView,
  skipFloat32,
  sliceCursorView,
  spaceUint16,
  spaceUint32,
  spaceUint8,
  writeFloat32,
  writePropIfChanged,
  writeString,
  writeUint32,
  writeUint8,
} from "../allocator/CursorView";
import { addChild, Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { NOOP } from "../config.common";
import { Player } from "../component/Player";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import {
  AddPeerIdMessage,
  NetworkMessage,
  NetworkMessageType,
  RemovePeerIdMessage,
  SetHostMessage,
  SetPeerIdMessage,
} from "./network.common";
import { createPrefabEntity } from "../prefab";
import { checkBitflag } from "../utils/checkBitflag";
import { RemoteNodeComponent } from "../node/node.game";
import {
  createRemoteMediaStream,
  createRemoteMediaStreamSource,
  createRemotePositionalAudioEmitter,
} from "../audio/audio.game";
import randomRange from "../utils/randomRange";
import { RigidBody } from "../physics/physics.game";

// type hack for postMessage(data, transfers) signature in worker
const worker: Worker = self as any;

/*********
 * Types *
 ********/

export interface GameNetworkState {
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
  cursorView: CursorView;
  addPlayerResourceQueue: [string, number][];
}

export enum NetworkAction {
  Create,
  Delete,
  UpdateChanged,
  UpdateSnapshot,
  FullChanged,
  FullSnapshot,
  Prefab,
  AssignPeerIdIndex,
  InformPlayerNetworkId,
  NewPeerSnapshot,
}

const writeMessageType = writeUint8;

type NetPipeData = [GameState, CursorView];

/******************
 * Initialization *
 *****************/

export const NetworkModule = defineModule<GameState, GameNetworkState>({
  name: "network",
  create: (ctx): GameNetworkState => ({
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
    cursorView: createCursorView(),
    addPlayerResourceQueue: [],
  }),
  init(ctx: GameState) {
    const network = getModule(ctx, NetworkModule);

    registerInboundMessageHandler(network, NetworkAction.Create, deserializeCreates);
    registerInboundMessageHandler(network, NetworkAction.UpdateChanged, deserializeUpdatesChanged);
    registerInboundMessageHandler(network, NetworkAction.UpdateSnapshot, deserializeUpdatesSnapshot);
    registerInboundMessageHandler(network, NetworkAction.Delete, deserializeDeletes);
    registerInboundMessageHandler(network, NetworkAction.FullSnapshot, deserializeSnapshot);
    registerInboundMessageHandler(network, NetworkAction.FullChanged, deserializeFullUpdate);
    registerInboundMessageHandler(network, NetworkAction.AssignPeerIdIndex, deserializePeerIdIndex);
    registerInboundMessageHandler(network, NetworkAction.InformPlayerNetworkId, deserializePlayerNetworkId);
    registerInboundMessageHandler(network, NetworkAction.NewPeerSnapshot, deserializeNewPeerSnapshot);

    const disposables = [
      registerMessageHandler(ctx, NetworkMessageType.SetHost, onSetHost),
      registerMessageHandler(ctx, NetworkMessageType.SetPeerId, onSetPeerId),
      registerMessageHandler(ctx, NetworkMessageType.AddPeerId, onAddPeerId),
      registerMessageHandler(ctx, NetworkMessageType.RemovePeerId, onRemovePeerId),
      registerMessageHandler(ctx, NetworkMessageType.NetworkMessage, onInboundNetworkMessage),
    ];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

/********************
 * Message Handlers *
 *******************/

const onInboundNetworkMessage = (ctx: GameState, message: NetworkMessage) => {
  const network = getModule(ctx, NetworkModule);
  const { packet } = message;
  network.incoming.push(packet);
};

const onAddPeerId = (ctx: GameState, message: AddPeerIdMessage) => {
  const network = getModule(ctx, NetworkModule);
  const { peerId } = message;

  if (network.peers.includes(peerId) || network.peerId === peerId) return;

  network.peers.push(peerId);
  network.newPeers.push(peerId);
  if (network.hosting) mapPeerIdAndIndex(ctx, peerId);
};

const onRemovePeerId = (ctx: GameState, message: RemovePeerIdMessage) => {
  const network = getModule(ctx, NetworkModule);
  const { peerId } = message;

  const i = network.peers.indexOf(peerId);
  if (i > -1) {
    const eid = network.peerIdToEntityId.get(peerId);
    if (eid) removeEntity(ctx.world, eid);

    network.peers.splice(i, 1);
    network.peerIdToIndex.delete(peerId);
  } else {
    console.warn(`cannot remove peerId ${peerId}, does not exist in peer list`);
  }
};

const onSetPeerId = (ctx: GameState, message: SetPeerIdMessage) => {
  const network = getModule(ctx, NetworkModule);
  const { peerId } = message;
  network.peerId = peerId;
  if (network.hosting) mapPeerIdAndIndex(ctx, peerId);
};

const onSetHost = (ctx: GameState, message: SetHostMessage) => {
  const network = getModule(ctx, NetworkModule);
  network.hosting = message.value;
};

/* Utils */

const mapPeerIdAndIndex = (ctx: GameState, peerId: string) => {
  const network = getModule(ctx, NetworkModule);
  const peerIdIndex = network.peerIdCount++;
  network.peerIdToIndex.set(peerId, peerIdIndex);
  network.indexToPeerId.set(peerIdIndex, peerId);
};

const isolateBits = (val: number, n: number, offset = 0) => val & (((1 << n) - 1) << offset);

export const getPeerIdFromNetworkId = (nid: number) => isolateBits(nid, 16);
export const getLocalIdFromNetworkId = (nid: number) => isolateBits(nid >>> 16, 16);

// hack - could also temporarily send whole peerId string to avoid potential collisions
const peerIdIndex = randomRange(0, 0xffff);
export const createNetworkId = (state: GameState) => {
  const network = getModule(state, NetworkModule);
  const localId = network.removedLocalIds.shift() || network.localIdCount++;
  // const peerIdIndex = network.peerIdToIndex.get(network.peerId);

  if (peerIdIndex === undefined) {
    // console.error("could not create networkId, peerId not set in peerIdToIndex map");
    throw new Error("could not create networkId, peerId not set in peerIdToIndex map");
  }

  // bitwise operations in JS are limited to 32 bit integers (https://developer.mozilla.org/en-US/docs/web/javascript/reference/operators#binary_bitwise_operators)
  // logical right shift by 0 to treat as an unsigned integer
  return ((localId << 16) | peerIdIndex) >>> 0;
};

export const deleteNetworkId = (ctx: GameState, nid: number) => {
  const network = getModule(ctx, NetworkModule);
  const localId = getLocalIdFromNetworkId(nid);
  network.removedLocalIds.push(localId);
};

/* Components */

export const Networked = defineComponent({
  // networkId contains both peerIdIndex (owner) and localNetworkId
  networkId: Types.ui32,
  position: [Types.f32, 3],
  quaternion: [Types.f32, 4],
  velocity: [Types.f32, 3],
});

export const Owned = defineComponent();

/* Queries */

export const networkedQuery = defineQuery([Networked]);
export const enteredNetworkedQuery = enterQuery(networkedQuery);
export const exitedNetworkedQuery = exitQuery(networkedQuery);

export const ownedNetworkedQuery = defineQuery([Networked, Owned]);
export const createdOwnedNetworkedQuery = enterQuery(ownedNetworkedQuery);
export const deletedOwnedNetworkedQuery = exitQuery(ownedNetworkedQuery);
export const remoteNetworkedQuery = defineQuery([Networked, Not(Owned)]);

// bitecs todo: add defineQueue to bitECS / allow multiple enter/exit queries to avoid duplicate query
export const networkIdQuery = defineQuery([Networked, Owned]);
export const enteredNetworkIdQuery = enterQuery(networkIdQuery);
export const exitedNetworkIdQuery = exitQuery(networkIdQuery);

export const ownedPlayerQuery = defineQuery([Player, Owned]);
export const enteredOwnedPlayerQuery = enterQuery(ownedPlayerQuery);
export const exitedOwnedPlayerQuery = exitQuery(ownedPlayerQuery);

export const remotePlayerQuery = defineQuery([Player, Not(Owned)]);
export const enteredRemotePlayerQuery = enterQuery(remotePlayerQuery);
export const exitedRemotePlayerQuery = exitQuery(remotePlayerQuery);

/* Transform serialization */

export const serializeTransformSnapshot = (v: CursorView, eid: number) => {
  const position = Transform.position[eid];
  writeFloat32(v, position[0]);
  writeFloat32(v, position[1]);
  writeFloat32(v, position[2]);

  const quaternion = Transform.quaternion[eid];
  writeFloat32(v, quaternion[0]);
  writeFloat32(v, quaternion[1]);
  writeFloat32(v, quaternion[2]);
  writeFloat32(v, quaternion[3]);

  return v;
};

export const deserializeTransformSnapshot = (v: CursorView, eid: number | undefined) => {
  if (eid !== undefined) {
    const position = Networked.position[eid];
    // const position = Transform.position[eid];
    position[0] = readFloat32(v);
    position[1] = readFloat32(v);
    position[2] = readFloat32(v);

    const quaternion = Networked.quaternion[eid];
    // const quaternion = Transform.quaternion[eid];
    quaternion[0] = readFloat32(v);
    quaternion[1] = readFloat32(v);
    quaternion[2] = readFloat32(v);
    quaternion[3] = readFloat32(v);
  } else {
    scrollCursorView(v, Float32Array.BYTES_PER_ELEMENT * 7);
  }

  return v;
};

const defineChangedSerializer = (...fns: ((v: CursorView, eid: number) => boolean)[]) => {
  const spacer = fns.length <= 8 ? spaceUint8 : fns.length <= 16 ? spaceUint16 : spaceUint32;
  return (v: CursorView, eid: number) => {
    const writeChangeMask = spacer(v);
    let changeMask = 0;
    let b = 0;
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      changeMask |= fn(v, eid) ? 1 << b++ : b++ && 0;
    }
    writeChangeMask(changeMask);
    return changeMask > 0;
  };
};

export const serializeTransformChanged = defineChangedSerializer(
  (v, eid) => writePropIfChanged(v, Transform.position[eid], 0),
  (v, eid) => writePropIfChanged(v, Transform.position[eid], 1),
  (v, eid) => writePropIfChanged(v, Transform.position[eid], 2),
  (v, eid) => writePropIfChanged(v, RigidBody.velocity[eid], 0),
  (v, eid) => writePropIfChanged(v, RigidBody.velocity[eid], 1),
  (v, eid) => writePropIfChanged(v, RigidBody.velocity[eid], 2),
  (v, eid) => writePropIfChanged(v, Transform.quaternion[eid], 0),
  (v, eid) => writePropIfChanged(v, Transform.quaternion[eid], 1),
  (v, eid) => writePropIfChanged(v, Transform.quaternion[eid], 2),
  (v, eid) => writePropIfChanged(v, Transform.quaternion[eid], 3)
);

// todo: bench performance of defineChangedSerializer vs raw function

// export const serializeTransformChanged = (v: CursorView, eid: number) => {
//   const writeChangeMask = spaceUint8(v);
//   let changeMask = 0;
//   let b = 0;

//   const position = Transform.position[eid];
//   changeMask |= writePropIfChanged(v, position, 0) ? 1 << b++ : b++ && 0;
//   changeMask |= writePropIfChanged(v, position, 1) ? 1 << b++ : b++ && 0;
//   changeMask |= writePropIfChanged(v, position, 2) ? 1 << b++ : b++ && 0;

//   const rotation = Transform.rotation[eid];
//   changeMask |= writePropIfChanged(v, rotation, 0) ? 1 << b++ : b++ && 0;
//   changeMask |= writePropIfChanged(v, rotation, 1) ? 1 << b++ : b++ && 0;
//   changeMask |= writePropIfChanged(v, rotation, 2) ? 1 << b++ : b++ && 0;

//   writeChangeMask(changeMask);

//   return changeMask > 0;
// };

export const defineChangedDeserializer = (...fns: ((v: CursorView, eid: number | undefined) => void)[]) => {
  const readChangeMask = fns.length <= 8 ? readUint8 : fns.length <= 16 ? readUint16 : readUint32;
  return (v: CursorView, eid: number | undefined) => {
    const changeMask = readChangeMask(v);
    let b = 0;
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      if (checkBitflag(changeMask, 1 << b++)) fn(v, eid);
    }
  };
};

export const deserializeTransformChanged = defineChangedDeserializer(
  (v, eid) => (eid ? (Networked.position[eid][0] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Networked.position[eid][1] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Networked.position[eid][2] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Networked.velocity[eid][0] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Networked.velocity[eid][1] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Networked.velocity[eid][2] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Networked.quaternion[eid][0] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Networked.quaternion[eid][1] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Networked.quaternion[eid][2] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Networked.quaternion[eid][3] = readFloat32(v)) : skipFloat32(v))
);

// export const deserializeTransformChanged = defineChangedDeserializer(
//   (v, eid) => (eid ? (Transform.position[eid][0] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (Transform.position[eid][1] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (Transform.position[eid][2] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (Transform.quaternion[eid][0] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (Transform.quaternion[eid][1] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (Transform.quaternion[eid][2] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (Transform.quaternion[eid][3] = readFloat32(v)) : skipFloat32(v))
// );

// export const deserializeTransformChanged = (v: CursorView, eid: number) => {
//   const changeMask = readUint8(v);
//   let b = 0;

//   const position = Transform.position[eid];
//   if (checkBitflag(changeMask, 1 << b++)) position[0] = readFloat32(v);
//   if (checkBitflag(changeMask, 1 << b++)) position[1] = readFloat32(v);
//   if (checkBitflag(changeMask, 1 << b++)) position[2] = readFloat32(v);

//   const rotation = Transform.rotation[eid];
//   if (checkBitflag(changeMask, 1 << b++)) rotation[0] = readFloat32(v);
//   if (checkBitflag(changeMask, 1 << b++)) rotation[1] = readFloat32(v);
//   if (checkBitflag(changeMask, 1 << b++)) rotation[2] = readFloat32(v);

//   return v;
// };

/* Create */

export function serializeCreatesSnapshot(input: NetPipeData) {
  const [state, v] = input;
  const entities = ownedNetworkedQuery(state.world);
  // todo: optimize length written with maxEntities config
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const prefabName = state.entityPrefabMap.get(eid) || "cube";
    if (prefabName) {
      writeUint32(v, nid);
      writeString(v, prefabName);
    } else {
      console.error("could not write entity prefab name,", eid, "does not exist in entityPrefabMap");
    }
  }
  return input;
}

export function serializeCreates(input: NetPipeData) {
  const [state, v] = input;
  const entities = createdOwnedNetworkedQuery(state.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const prefabName = state.entityPrefabMap.get(eid) || "cube";
    if (prefabName) {
      writeUint32(v, nid);
      writeString(v, prefabName);
      console.log("serializing creation for nid", nid, "eid", eid, "prefab", prefabName);
    } else {
      console.error("could not write entity prefab name,", eid, "does not exist in entityPrefabMap");
    }
  }
  return input;
}

export function createRemoteNetworkedEntity(state: GameState, nid: number, prefab: string) {
  const network = getModule(state, NetworkModule);
  const eid = createPrefabEntity(state, prefab);

  // remote entity not owned by default so lock the rigidbody
  // const body = RigidBody.store.get(eid);
  // if (body) {
  //   body.lockTranslations(true, true);
  //   body.lockRotations(true, true);
  // }

  addComponent(state.world, Networked, eid);
  Networked.networkId[eid] = nid;
  network.networkIdToEntityId.set(nid, eid);

  addChild(state.activeScene, eid);

  return eid;
}

export function deserializeCreates(input: NetPipeData) {
  const [state, v] = input;
  const network = getModule(state, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const prefabName = readString(v);
    const existingEntity = network.networkIdToEntityId.get(nid);
    if (existingEntity) continue;
    const eid = createRemoteNetworkedEntity(state, nid, prefabName);
    console.log("deserializing creation - nid", nid, "eid", eid, "prefab", prefabName);
  }
  return input;
}

/* Update */

export function serializeUpdatesSnapshot(input: NetPipeData) {
  const [state, v] = input;
  const entities = ownedNetworkedQuery(state.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    writeUint32(v, nid);
    serializeTransformSnapshot(v, eid);
  }
  return input;
}

export function serializeUpdatesChanged(input: NetPipeData) {
  const [state, v] = input;
  const entities = ownedNetworkedQuery(state.world);
  const writeCount = spaceUint32(v);
  let count = 0;
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const rewind = rewindCursorView(v);
    const writeNid = spaceUint32(v);
    const written = serializeTransformChanged(v, eid);
    if (written) {
      writeNid(nid);
      count += 1;
    } else {
      rewind();
    }
  }
  writeCount(count);
  return input;
}

export function deserializeUpdatesSnapshot(input: NetPipeData) {
  const [state, v] = input;
  const network = getModule(state, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = network.networkIdToEntityId.get(nid);
    if (!eid) {
      console.warn(`could not deserialize update for non-existent entity for networkId ${nid}`);
      // continue;
      // createRemoteNetworkedEntity(state, nid);
    }
    deserializeTransformSnapshot(v, eid);
  }
  return input;
}

export function deserializeUpdatesChanged(input: NetPipeData) {
  const [state, v] = input;
  const network = getModule(state, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = network.networkIdToEntityId.get(nid);
    if (!eid) {
      console.warn(`could not deserialize update for non-existent entity for networkId ${nid}`);
      // continue;
      // createRemoteNetworkedEntity(state, nid);
    }
    deserializeTransformChanged(v, eid);
  }
  return input;
}

/* Delete */

export function serializeDeletes(input: NetPipeData) {
  const [state, v] = input;
  const entities = deletedOwnedNetworkedQuery(state.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    writeUint32(v, nid);
    console.log("serialized deletion for nid", nid, "eid", eid);
  }
  return input;
}

export function deserializeDeletes(input: NetPipeData) {
  const [state, v] = input;
  const network = getModule(state, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = network.networkIdToEntityId.get(nid);
    if (!eid) {
      console.warn(`could not remove networkId ${nid}, no matching entity`);
    } else {
      console.log("deserialized deletion for nid", nid, "eid", eid);
      removeEntity(state.world, eid);
      network.networkIdToEntityId.delete(nid);
    }
  }
  return input;
}

/* PeerId Message */

// host sends peerIdIndex to new peers
export function serializePeerIdIndex(input: NetPipeData, peerId: string) {
  const [state, v] = input;
  const network = getModule(state, NetworkModule);
  const peerIdIndex = network.peerIdToIndex.get(peerId);

  console.log("sending peerIdIndex", peerId, peerIdIndex);
  if (peerIdIndex === undefined) {
    // console.error(`unable to serialize peerIdIndex message - peerIdIndex not set for ${peerId}`);
    throw new Error(`unable to serialize peerIdIndex message - peerIdIndex not set for ${peerId}`);
  }

  writeString(v, peerId);
  writeUint8(v, peerIdIndex);

  return input;
}

// peer decodes the peerIdIndex
export function deserializePeerIdIndex(input: NetPipeData) {
  const [state, v] = input;
  const network = getModule(state, NetworkModule);
  const peerId = readString(v);
  const peerIdIndex = readUint8(v);

  network.peerIdToIndex.set(peerId, peerIdIndex);
  network.indexToPeerId.set(peerIdIndex, peerId);
  console.log("recieving peerIdIndex", peerId, peerIdIndex);
  return input;
}

// ad-hoc messages view
const messageView = createCursorView(new ArrayBuffer(1000));

export function createPeerIdIndexMessage(state: GameState, peerId: string) {
  const input: NetPipeData = [state, messageView];
  writeMessageType(messageView, NetworkAction.AssignPeerIdIndex);
  serializePeerIdIndex(input, peerId);
  return sliceCursorView(messageView);
}

/* Player NetworkId Message */

export function serializePlayerNetworkId(input: NetPipeData) {
  const [state, cv] = input;
  const network = getModule(state, NetworkModule);
  const peerId = network.peerId;
  const peerEid = network.peerIdToEntityId.get(peerId);
  const peerIdIndex = network.peerIdToIndex.get(peerId);
  console.log(`serializePlayerNetworkId`, peerId, peerEid, peerIdIndex);
  if (peerEid === undefined || peerIdIndex === undefined) {
    console.error(
      `could not send NetworkMessage.AssignPlayerEntity, ${peerId} not set on peerIdToEntity/peerIdToIndex map`
    );
    return input;
  }

  const peerNid = Networked.networkId[peerEid];

  writeString(cv, peerId);
  writeUint32(cv, peerNid);
  return input;
}

export function deserializePlayerNetworkId(input: NetPipeData) {
  const [state, cv] = input;
  const network = getModule(state, NetworkModule);
  // read
  const peerId = readString(cv);
  const peerNid = readUint32(cv);

  const peid = network.networkIdToEntityId.get(peerNid);
  if (peid !== undefined) {
    network.peerIdToEntityId.set(peerId, peid);
    console.log("deserializePlayerNetworkId", network.peerIdToEntityId);

    network.addPlayerResourceQueue.push([peerId, peid]);

    // const remoteNode = RemoteNodeComponent.get(peid);

    // if (!remoteNode) {
    //   throw new Error(`Couldn't find remote node for networked entity: ${peid} peerId: ${peerId}`);
    // }

    // remoteNode.audioEmitter = createRemotePositionalAudioEmitter(state, {
    //   sources: [
    //     createRemoteMediaStreamSource(state, {
    //       stream: createRemoteMediaStream(state, peerId),
    //     }),
    //   ],
    // });
  } else {
    console.error("could not find peer's entityId within network.networkIdToEntityId");
  }

  return input;
}

export function createPlayerNetworkIdMessage(state: GameState) {
  const input: NetPipeData = [state, messageView];
  writeMessageType(messageView, NetworkAction.InformPlayerNetworkId);
  serializePlayerNetworkId(input);
  return sliceCursorView(messageView);
}

/* Message Factories */

const setMessageType = (type: NetworkAction) => (input: NetPipeData) => {
  const [, v] = input;
  writeMessageType(v, type);
  return input;
};

// playerNetIdMsg + createMsg + deleteMsg
export const createNewPeerSnapshotMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  setMessageType(NetworkAction.NewPeerSnapshot),
  serializeCreatesSnapshot,
  serializeUpdatesSnapshot,
  serializePlayerNetworkId,
  ([_, v]) => sliceCursorView(v)
);

// reliably send all entities and their data to newly seen clients on-join
export const createFullSnapshotMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  setMessageType(NetworkAction.FullSnapshot),
  serializeCreatesSnapshot,
  serializeUpdatesSnapshot,
  ([_, v]) => {
    if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 2 * Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

// reilably send creates/updates/deletes in one message
export const createFullChangedMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  setMessageType(NetworkAction.FullChanged),
  serializeCreates,
  serializeUpdatesChanged,
  serializeDeletes,
  ([_, v]) => {
    if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 3 * Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

// reliably send creates
export const createCreateMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  setMessageType(NetworkAction.Create),
  serializeCreates,
  ([_, v]) => {
    if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 1 * Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

// unreliably send updates
export const createUpdateChangedMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  setMessageType(NetworkAction.UpdateChanged),
  serializeUpdatesChanged,
  ([_, v]) => {
    if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 1 * Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

// unreliably send updates
export const createUpdateSnapshotMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  setMessageType(NetworkAction.UpdateSnapshot),
  serializeUpdatesSnapshot,
  ([_, v]) => {
    if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 1 * Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

// reliably send deletes
export const createDeleteMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  setMessageType(NetworkAction.Delete),
  serializeDeletes,
  ([_, v]) => {
    if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 1 * Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

/* Send */

export const broadcastReliable = (state: GameState, packet: ArrayBuffer) => {
  // state.network.peers.forEach((peerId: string) => {
  //   sendReliable(state, peerId, packet);
  // });
  worker.postMessage(
    {
      type: NetworkMessageType.NetworkBroadcast,
      packet,
      reliable: true,
    },
    [packet]
  );
};

export const broadcastUnreliable = (state: GameState, packet: ArrayBuffer) => {
  // state.network.peers.forEach((peerId: string) => {
  //   sendUnreliable(peerId, packet);
  // });
  worker.postMessage(
    {
      type: NetworkMessageType.NetworkBroadcast,
      packet,
      reliable: false,
    },
    [packet]
  );
};

export const sendReliable = (state: GameState, peerId: string, packet: ArrayBuffer) => {
  // todo: headers
  // packet = writeHeaders(state, peerId, packet);
  worker.postMessage(
    {
      type: NetworkMessageType.NetworkMessage,
      peerId,
      packet,
      reliable: true,
    },
    [packet]
  );
};

export const sendUnreliable = (peerId: string, packet: ArrayBuffer) => {
  worker.postMessage(
    {
      type: NetworkMessageType.NetworkMessage,
      peerId,
      packet,
      reliable: false,
    },
    [packet]
  );
};

const assignNetworkIds = (state: GameState) => {
  const entered = enteredNetworkIdQuery(state.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    Networked.networkId[eid] = createNetworkId(state) || 0;
    console.log("networkId", Networked.networkId[eid], "assigned to eid", eid);
  }
  return state;
};

const deleteNetworkIds = (state: GameState) => {
  const exited = exitedNetworkIdQuery(state.world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    deleteNetworkId(state, Networked.networkId[eid]);
    Networked.networkId[eid] = NOOP;
  }
  return state;
};

const sendUpdates = (ctx: GameState) => {
  const network = getModule(ctx, NetworkModule);
  const data: NetPipeData = [ctx, network.cursorView];

  // only send updates when:
  // - we have connected peers
  // - peerIdIndex has been assigned
  // - player rig has spawned
  const haveConnectedPeers = network.peers.length > 0;
  const spawnedPlayerRig = ownedPlayerQuery(ctx.world).length > 0;

  if (haveConnectedPeers && spawnedPlayerRig) {
    // send snapshot update to all new peers
    const haveNewPeers = network.newPeers.length > 0;
    if (haveNewPeers) {
      const newPeerSnapshotMsg = createNewPeerSnapshotMessage(data);

      while (network.newPeers.length) {
        const theirPeerId = network.newPeers.shift();
        if (theirPeerId) {
          // if hosting, broadcast peerIdIndex message
          if (network.hosting) broadcastReliable(ctx, createPeerIdIndexMessage(ctx, theirPeerId));

          sendReliable(ctx, theirPeerId, newPeerSnapshotMsg);
        }
      }
    } else {
      // reliably send full messages for now
      const msg = createFullChangedMessage(data);
      if (msg.byteLength) broadcastReliable(ctx, msg);
    }
  }

  return ctx;
};

export function OutboundNetworkSystem(state: GameState) {
  const network = getModule(state, NetworkModule);

  const hasPeerIdIndex = network.peerIdToIndex.has(network.peerId);
  if (!hasPeerIdIndex) return state;

  // assign networkIds before serializing game state
  assignNetworkIds(state);
  // serialize and send all outgoing updates
  sendUpdates(state);
  // delete networkIds after serializing game state (deletes serialization needs to know the nid before removal)
  deleteNetworkIds(state);

  return state;
}

/* Inbound */

const deserializeNewPeerSnapshot = pipe(deserializeCreates, deserializeUpdatesSnapshot, deserializePlayerNetworkId);
const deserializeSnapshot = pipe(deserializeCreates, deserializeUpdatesSnapshot);
const deserializeFullUpdate = pipe(deserializeCreates, deserializeUpdatesChanged, deserializeDeletes);

const processNetworkMessage = (state: GameState, msg: ArrayBuffer) => {
  const cursorView = createCursorView(msg);
  const messageType = readUint8(cursorView);
  const input: NetPipeData = [state, cursorView];
  const { messageHandlers } = getModule(state, NetworkModule);

  const handler = messageHandlers[messageType];
  if (!handler) {
    console.error(
      "could not process network message, no handler registered for messageType",
      NetworkAction[messageType]
    );
    return;
  }

  handler(input);
};

const processNetworkMessages = (state: GameState) => {
  const network = getModule(state, NetworkModule);
  while (network.incoming.length) {
    const msg = network.incoming.pop();
    if (msg) processNetworkMessage(state, msg);
  }
};

const registerInboundMessageHandler = (network: GameNetworkState, type: number, cb: (input: NetPipeData) => void) => {
  network.messageHandlers[type] = cb;
};

export function InboundNetworkSystem(state: GameState) {
  processNetworkMessages(state);

  const network = getModule(state, NetworkModule);

  for (let i = network.addPlayerResourceQueue.length - 1; i >= 0; i--) {
    const [peerId, peid] = network.addPlayerResourceQueue[i];
    const remoteNode = RemoteNodeComponent.get(peid);
    if (remoteNode) {
      network.addPlayerResourceQueue.splice(i, 1);
      remoteNode.audioEmitter = createRemotePositionalAudioEmitter(state, {
        sources: [
          createRemoteMediaStreamSource(state, {
            stream: createRemoteMediaStream(state, peerId),
          }),
        ],
      });
    }
  }
}
