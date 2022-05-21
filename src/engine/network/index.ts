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
import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";

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
} from "./CursorView";
import { addChild, Transform } from "../component/transform";
import { GameState } from "../GameWorker";
import { WorkerMessageType } from "../WorkerMessage";
import { createCube } from "../prefab";
import { NOOP } from "../config.common";
import { ownedPlayerQuery } from "../component/Player";
import { RigidBody } from "../physics";
import { sendAudioPeerEntityMessage } from "../audio/audio.game";

// type hack for postMessage(data, transfers) signature in worker
const worker: Worker = self as any;

/* Types */

export enum NetworkMessage {
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

/* Utils */

const isolateBits = (val: number, n: number, offset = 0) => val & (((1 << n) - 1) << offset);

export const getPeerIdFromNetworkId = (nid: number) => isolateBits(nid, 16);
export const getLocalIdFromNetworkId = (nid: number) => isolateBits(nid >>> 16, 16);

// hack - could also temporarily send whole peerId string to avoid potential collisions
const rndRange = (min: number, max: number) => Math.random() * (max - min) + min;
const peerIdIndex = rndRange(0, 0xffff);
export const createNetworkId = ({ network }: GameState) => {
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

export const deleteNetworkId = ({ network }: GameState, nid: number) => {
  const localId = getLocalIdFromNetworkId(nid);
  network.removedLocalIds.push(localId);
};

/* Components */

export const Networked = defineComponent({
  // networkId contains both peerIdIndex (owner) and localNetworkId
  networkId: Types.ui32,
});

export const Owned = defineComponent();

export const NetworkTransform = defineComponent({
  position: [Types.f32, 3],
  quaternion: [Types.f32, 4],
});

/* Queries */

export const networkedQuery = defineQuery([Networked]);
export const enteredNetworkedQuery = enterQuery(networkedQuery);
export const exitedNetworkedQuery = exitQuery(networkedQuery);

export const ownedNetworkedQuery = defineQuery([Networked, Owned]);
export const createdOwnedNetworkedQuery = enterQuery(ownedNetworkedQuery);
export const deletedOwnedNetworkedQuery = exitQuery(ownedNetworkedQuery);
// eslint-disable-next-line new-cap
export const remoteNetworkedQuery = defineQuery([Networked, Not(Owned)]);

// bitecs todo: add defineQueue to bitECS / allow multiple enter/exit queries to avoid duplicate query
export const networkIdQuery = defineQuery([Networked, Owned]);
export const enteredNetworkIdQuery = enterQuery(networkIdQuery);
export const exitedNetworkIdQuery = exitQuery(networkIdQuery);

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
    // const position = NetworkTransform.position[eid];
    const position = Transform.position[eid];
    position[0] = readFloat32(v);
    position[1] = readFloat32(v);
    position[2] = readFloat32(v);

    // const quaternion = NetworkTransform.quaternion[eid];
    const quaternion = Transform.quaternion[eid];
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

const checkBitflag = (mask: number, flag: number) => (mask & flag) === flag;

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

// export const deserializeTransformChanged = defineChangedDeserializer(
//   (v, eid) => (eid ? (NetworkTransform.position[eid][0] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (NetworkTransform.position[eid][1] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (NetworkTransform.position[eid][2] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (NetworkTransform.quaternion[eid][0] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (NetworkTransform.quaternion[eid][1] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (NetworkTransform.quaternion[eid][2] = readFloat32(v)) : skipFloat32(v)),
//   (v, eid) => (eid ? (NetworkTransform.quaternion[eid][3] = readFloat32(v)) : skipFloat32(v))
// );

export const deserializeTransformChanged = defineChangedDeserializer(
  (v, eid) => (eid ? (Transform.position[eid][0] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Transform.position[eid][1] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Transform.position[eid][2] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Transform.quaternion[eid][0] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Transform.quaternion[eid][1] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Transform.quaternion[eid][2] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Transform.quaternion[eid][3] = readFloat32(v)) : skipFloat32(v))
);

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

// TODO: make a loading entity prefab to display if prefab template hasn't been loaded before deserializing
// add component+system for loading and swapping the prefab
const createLoadingEntity = createCube;

const createPrefabEntity = (state: GameState, prefab: string) => {
  const create = state.prefabTemplateMap.get(prefab)?.create;
  if (create) {
    return create(state);
  } else {
    return createLoadingEntity(state);
  }
};

export function createRemoteNetworkedEntity(state: GameState, nid: number, prefab: string) {
  const eid = createPrefabEntity(state, prefab);

  // remote entity not owned by default so lock the rigidbody
  // const body = RigidBody.store.get(eid);
  // if (body) {
  //   body.lockTranslations(true, true);
  //   body.lockRotations(true, true);
  // }

  addComponent(state.world, Networked, eid);
  // addComponent(state.world, NetworkTransform, eid);
  Networked.networkId[eid] = nid;
  state.network.networkIdToEntityId.set(nid, eid);

  addChild(state.scene, eid);

  return eid;
}

export function deserializeCreates(input: NetPipeData) {
  const [state, v] = input;
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const prefabName = readString(v);
    const existingEntity = state.network.networkIdToEntityId.get(nid);
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
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = state.network.networkIdToEntityId.get(nid);
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
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = state.network.networkIdToEntityId.get(nid);
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
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = state.network.networkIdToEntityId.get(nid);
    if (!eid) {
      console.warn(`could not remove networkId ${nid}, no matching entity`);
    } else {
      console.log("deserialized deletion for nid", nid, "eid", eid);
      removeEntity(state.world, eid);
      state.network.networkIdToEntityId.delete(nid);
    }
  }
  return input;
}

/* PeerId Message */

// host sends peerIdIndex to new peers
export function serializePeerIdIndex(input: NetPipeData, peerId: string) {
  const [state, v] = input;
  const peerIdIndex = state.network.peerIdToIndex.get(peerId);

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
  const peerId = readString(v);
  const peerIdIndex = readUint8(v);

  state.network.peerIdToIndex.set(peerId, peerIdIndex);
  state.network.indexToPeerId.set(peerIdIndex, peerId);
  console.log("recieving peerIdIndex", peerId, peerIdIndex);
  return input;
}

// ad-hoc messages view
const messageView = createCursorView(new ArrayBuffer(1000));

export function createPeerIdIndexMessage(state: GameState, peerId: string) {
  const input: NetPipeData = [state, messageView];
  writeMessageType(messageView, NetworkMessage.AssignPeerIdIndex);
  serializePeerIdIndex(input, peerId);
  return sliceCursorView(messageView);
}

/* Player NetworkId Message */

export async function serializePlayerNetworkId(input: NetPipeData, peerId: string) {
  const [state, cv] = input;
  const peerEid = state.network.peerIdToEntityId.get(peerId);
  const peerIdIndex = state.network.peerIdToIndex.get(peerId);
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
  // read
  const peerId = readString(cv);
  const peerNid = readUint32(cv);

  // hack - for some reason this message arrives before the peer entity is created
  // despite being sent after the entity creation message
  const interval = setInterval(() => {
    const peid = state.network.networkIdToEntityId.get(peerNid);
    if (peid !== undefined) {
      state.network.peerIdToEntityId.set(peerId, peid);
      console.log("deserializePlayerNetworkId", state.network.peerIdToEntityId);
      sendAudioPeerEntityMessage(peerId, peid);
      clearInterval(interval);
    }
  }, 10);

  return input;
}

export function createPlayerNetworkIdMessage(state: GameState, peerId: string) {
  const input: NetPipeData = [state, messageView];
  writeMessageType(messageView, NetworkMessage.InformPlayerNetworkId);
  serializePlayerNetworkId(input, peerId);
  return sliceCursorView(messageView);
}

/* Message Factories */

const setMessageType = (type: NetworkMessage) => (input: NetPipeData) => {
  const [, v] = input;
  writeMessageType(v, type);
  return input;
};

// reliably send all entities and their data to newly seen clients on-join
export const createFullSnapshotMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  setMessageType(NetworkMessage.FullSnapshot),
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
  setMessageType(NetworkMessage.FullChanged),
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
  setMessageType(NetworkMessage.Create),
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
  setMessageType(NetworkMessage.UpdateChanged),
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
  setMessageType(NetworkMessage.UpdateSnapshot),
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
  setMessageType(NetworkMessage.Delete),
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
      type: WorkerMessageType.ReliableNetworkBroadcast,
      packet,
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
      type: WorkerMessageType.UnreliableNetworkBroadcast,
      packet,
    },
    [packet]
  );
};

export const sendReliable = (state: GameState, peerId: string, packet: ArrayBuffer) => {
  // todo: headers
  // packet = writeHeaders(state, peerId, packet);
  worker.postMessage(
    {
      type: WorkerMessageType.ReliableNetworkMessage,
      peerId,
      packet,
    },
    [packet]
  );
};

export const sendUnreliable = (peerId: string, packet: ArrayBuffer) => {
  worker.postMessage(
    {
      type: WorkerMessageType.UnreliableNetworkMessage,
      peerId,
      packet,
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

const sendUpdates = (input: NetPipeData) => (state: GameState) => {
  // only send updates when:
  // - we have connected peers
  // - peerIdIndex has been assigned
  // - player rig has spawned
  const haveConnectedPeers = state.network.peers.length > 0;
  const spawnedPlayerRig = ownedPlayerQuery(state.world).length > 0;

  if (haveConnectedPeers && spawnedPlayerRig) {
    // send snapshot update to all new peers
    const haveNewPeers = state.network.newPeers.length > 0;
    if (haveNewPeers) {
      const snapshotMsg = createFullSnapshotMessage(input);
      while (state.network.newPeers.length) {
        const theirPeerId = state.network.newPeers.shift();
        if (theirPeerId) {
          // if hosting, broadcast peerIdIndex message
          if (state.network.hosting) broadcastReliable(state, createPeerIdIndexMessage(state, theirPeerId));

          // send snapshot to peer
          if (snapshotMsg.byteLength) {
            sendReliable(state, theirPeerId, snapshotMsg);
          }

          // send this player's NID so remote knows what our player entity is
          // todo: this arrives before creation messages despite being sent after
          sendReliable(state, theirPeerId, createPlayerNetworkIdMessage(state, state.network.peerId));
        }
      }
    } else {
      // reliably send full messages for now
      const msg = createFullChangedMessage(input);
      if (msg.byteLength) broadcastReliable(state, msg);
    }
  }

  return state;
};

export function createOutgoingNetworkSystem(state: GameState) {
  const cursorView = createCursorView();
  const input: NetPipeData = [state, cursorView];
  const pipeline = pipe(
    // assign networkIds before serializing game state
    assignNetworkIds,
    // serialize and send all outgoing updates
    sendUpdates(input),
    // delete networkIds after serializing game state (deletes serialization needs to know the nid before removal)
    deleteNetworkIds
  );
  return function OutgoingNetworkSystem(state: GameState) {
    const hasPeerIdIndex = state.network.peerIdToIndex.has(state.network.peerId);
    if (!hasPeerIdIndex) return state;

    return pipeline(state);

    // assignNetworkIds(state);
    // sendUpdates(state);

    // todo: reliably send creates
    // const createMsg = createCreateMessage(input);
    // broadcastReliable(state, createMsg)

    // todo: reliably send deletes
    // const deleteMsg = createDeleteMessage(input);
    // broadcastReliable(state, deleteMsg);

    // todo: unreliably send changed updates
    // const updateMsg = createUpdateChangedMessage(input);
    // broadcastUneliable(state, updateMsg);

    // deleteNetworkIds(state);
  };
}

/* Incoming */

const deserializeSnapshot = pipe(deserializeCreates, deserializeUpdatesSnapshot);
const deserializeFullUpdate = pipe(deserializeCreates, deserializeUpdatesChanged, deserializeDeletes);

const processNetworkMessage = (state: GameState, msg: ArrayBuffer) => {
  const cursorView = createCursorView(msg);
  const messageType = readUint8(cursorView);
  const input: NetPipeData = [state, cursorView];
  const { messageHandlers } = state.network;
  const handler = messageHandlers[messageType];
  handler(input);
};

const processNetworkMessages = (state: GameState) => {
  while (state.network.incoming.length) {
    const msg = state.network.incoming.pop();
    if (msg) processNetworkMessage(state, msg);
  }
};

const registerIncomingMessageHandler = (state: GameState, type: number, cb: (input: NetPipeData) => void) => {
  state.network.messageHandlers[type] = cb;
};

export function createIncomingNetworkSystem(state: GameState) {
  registerIncomingMessageHandler(state, NetworkMessage.Create, deserializeCreates);
  registerIncomingMessageHandler(state, NetworkMessage.UpdateChanged, deserializeUpdatesChanged);
  registerIncomingMessageHandler(state, NetworkMessage.UpdateSnapshot, deserializeUpdatesSnapshot);
  registerIncomingMessageHandler(state, NetworkMessage.Delete, deserializeDeletes);
  registerIncomingMessageHandler(state, NetworkMessage.FullSnapshot, deserializeSnapshot);
  registerIncomingMessageHandler(state, NetworkMessage.FullChanged, deserializeFullUpdate);
  registerIncomingMessageHandler(state, NetworkMessage.AssignPeerIdIndex, deserializePeerIdIndex);
  registerIncomingMessageHandler(state, NetworkMessage.InformPlayerNetworkId, deserializePlayerNetworkId);

  return function IncomingNetworkSystem(state: GameState) {
    processNetworkMessages(state);
  };
}

// eslint-disable-next-line new-cap
export const remoteRigidBodyQuery = defineQuery([RigidBody, Networked, NetworkTransform, Not(Owned)]);

const applyNetworkTransformToRigidBodyAndTransform = (body: RapierRigidBody, eid: number) => {
  const netPosition = NetworkTransform.position[eid];
  const netQuaternion = NetworkTransform.quaternion[eid];

  Transform.position[eid].set(netPosition);
  Transform.quaternion[eid].set(netQuaternion);

  body.setTranslation(new Vector3().fromArray(netPosition), true);
  body.setRotation(new Quaternion().fromArray(netQuaternion), true);
};

export function NetworkTransformSystem({ world }: GameState) {
  // lerp rigidbody towards network transform remote networked entities
  const remoteRigidBodyEntities = remoteRigidBodyQuery(world);
  for (let i = 0; i < remoteRigidBodyEntities.length; i++) {
    const eid = remoteRigidBodyEntities[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      applyNetworkTransformToRigidBodyAndTransform(body, eid);
    }
  }
}
