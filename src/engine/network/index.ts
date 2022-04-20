import {
  addComponent,
  defineComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  Not,
  pipe,
  removeEntity,
  Types,
} from "bitecs";

import {
  createCursorView,
  CursorView,
  moveCursorView,
  readFloat32,
  readUint32,
  readUint8,
  rewindCursorView,
  scrollCursorView,
  skipFloat32,
  sliceCursorView,
  spaceUint16,
  spaceUint32,
  spaceUint8,
  writeArrayBuffer,
  writeFloat32,
  writePropIfChanged,
  writeUint32,
  writeUint8,
} from "./CursorView";
import { addChild, Transform } from "../component/transform";
import { GameState } from "../GameWorker";
import { WorkerMessageType } from "../WorkerMessage";
import { createCube } from "../prefab";
import { loadRemoteResource } from "../resources/RemoteResourceManager";
import { GeometryType } from "../resources/GeometryResourceLoader";
import { RigidBody } from "../physics";
import { NOOP } from "../config";

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
}

type NetPipeData = [GameState, CursorView];

/* Utils */

const isolateBits = (val: number, n: number, offset = 0) => val & (((1 << n) - 1) << offset);

export const getPeerIdFromNetworkId = (nid: number) => isolateBits(nid, 16);
export const getLocalIdFromNetworkId = (nid: number) => isolateBits(nid >>> 16, 16);

export const createNetworkId = ({ network }: GameState) => {
  const localId = network.removedLocalIds.shift() || network.localIdCount++;
  const peerIdIndex = network.peerIdMap.get(network.peerId);

  if (peerIdIndex === undefined) {
    console.error("could not create networkId, peerId not set in peerIdMap");
    return;
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
  // networkId contains both peerId (owner) and localNetworkId
  networkId: Types.ui32,
});

export const Owned = defineComponent();

/* Queries */

export const networkedQuery = defineQuery([Networked]);
export const enteredNetworkedQuery = enterQuery(networkedQuery);
export const exitedNetworkedQuery = exitQuery(networkedQuery);

export const ownedNetworkedQuery = defineQuery([Networked, Owned]);
export const createdOwnedNetworkedQuery = enterQuery(ownedNetworkedQuery);
export const deletedOwnedNetworkedQuery = exitQuery(ownedNetworkedQuery);
// eslint-disable-next-line new-cap
export const remoteNetworkedQuery = defineQuery([Networked, Not(Owned)]);

// todo: add defineQueue to bitECS / allow multiple enter/exit queries to avoid duplicate query
export const networkIdQuery = defineQuery([Networked, Owned]);
export const createNetworkIdQuery = enterQuery(networkIdQuery);
export const deleteNetworkIdQuery = exitQuery(networkIdQuery);

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
    const position = Transform.position[eid];
    position[0] = readFloat32(v);
    position[1] = readFloat32(v);
    position[2] = readFloat32(v);

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
  return (v: CursorView, eid: number | undefined) => {
    const changeMask = readUint8(v);
    let b = 0;
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      if (checkBitflag(changeMask, 1 << b++)) fn(v, eid);
    }
  };
};

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
    writeUint32(v, nid);
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
    writeUint32(v, nid);
    // todo: serialize creation template
  }
  return input;
}

export function createRemoteNetworkedEntity(state: GameState, nid: number) {
  // todo: deserialize creation template

  const geometryResourceId = loadRemoteResource(state.resourceManager, {
    type: "geometry",
    geometryType: GeometryType.Box,
  });
  const eid = createCube(state, geometryResourceId);

  console.log("receiving remote entity -", "nid", nid, " eid", eid);

  // remote entity not owned by default so lock the rigidbody
  const body = RigidBody.store.get(eid);
  if (body) {
    body.lockTranslations(true, true);
    body.lockRotations(true, true);
  }

  addComponent(state.world, Networked, eid);
  Networked.networkId[eid] = nid;
  state.network.entityIdMap.set(nid, eid);

  addChild(state.scene, eid);

  return eid;
}

export function deserializeCreates(input: NetPipeData) {
  const [state, v] = input;
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    // todo: deserialize creation template
    createRemoteNetworkedEntity(state, nid);
  }
  return input;
}

/* Update */

export function serializeUpdatesSnapshot(input: NetPipeData) {
  const [state, v] = input;
  const entities = ownedNetworkedQuery(state.world);
  const writeCount = spaceUint32(v);
  let count = 0;
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    writeUint32(v, nid);
    serializeTransformSnapshot(v, eid);
    count += 1;
  }
  writeCount(count);
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
    const eid = state.network.entityIdMap.get(nid);
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
    const eid = state.network.entityIdMap.get(nid);
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
    writeUint32(v, eid);
  }
  return input;
}

export function deserializeDeletes(input: NetPipeData) {
  const [state, v] = input;
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = state.network.entityIdMap.get(nid);
    if (!eid) {
      console.warn(`could not remove networkId ${nid}, no matching entity`);
    } else {
      removeEntity(state.world, eid);
      state.network.entityIdMap.delete(nid);
    }
  }
  return input;
}

/* PeerId */

// host sends peerIdIndex to new peers
const { encode } = new TextEncoder();
export function serializePeerIdIndex(input: NetPipeData, peerId: string) {
  const [state, v] = input;
  const peerIdIndex = state.network.peerIdMap.get(peerId);

  if (peerIdIndex === undefined) {
    console.error(`unable to serialize peerIdIndex message - peerIdIndex not set for ${peerId}`);
    return input;
  }

  const encodedPeerId = encode(peerId);
  writeUint8(v, encodedPeerId.byteLength);
  writeArrayBuffer(v, encodedPeerId);
  writeUint8(v, peerIdIndex);

  return input;
}

// peer decodes the peerIdIndex
const { decode } = new TextDecoder();
export function deserializePeerIdIndex(input: NetPipeData) {
  const [state, v] = input;
  const peerIdByteLength = readUint8(v);
  const encodedPeerId = new Uint8Array(v.buffer, v.cursor, peerIdByteLength);
  const peerId = decode(encodedPeerId);
  const peerIdIndex = readUint8(v);
  state.network.peerIdMap.set(peerId, peerIdIndex);
  return input;
}

// ad-hoc messages view
const messageView = createCursorView(new ArrayBuffer(1000));

export function createPeerIdIndexMessage(state: GameState, peerId: string) {
  const input: NetPipeData = [state, messageView];
  writeUint8(messageView, NetworkMessage.AssignPeerIdIndex);
  serializePeerIdIndex(input, peerId);
  return sliceCursorView(messageView);
}

/* Message Factories */

// const sliceMessage = (input: NetPipeData) => {
//   const [, v] = input;
//   // if only message type was written, rewind
//   if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT) {
//     moveCursorView(v, 0);
//   }
//   return sliceCursorView(v);
// };

// const markMessageType = (type: NetworkMessage) => (input: NetPipeData) => {
//   const [state, v] = input;
//   const v2 = createCursorView(new ArrayBuffer(v.byteLength + 1));
//   writeUint8(v2, type);
//   writeArrayBuffer(v2, v.buffer);
//   return [state, v2];
// };

const setMessageType = (type: NetworkMessage) => (input: NetPipeData) => {
  const [, v] = input;
  writeUint8(v, type);
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

export const broadcastReliable = (packet: ArrayBuffer) => {
  postMessage({
    type: WorkerMessageType.ReliableNetworkBroadcast,
    packet,
  });
};

export const sendReliable = (peerId: string, packet: ArrayBuffer) => {
  postMessage({
    type: WorkerMessageType.ReliableNetworkMessage,
    peerId,
    packet,
  });
};

// const broadcastUnreliable = (state: GameState, packet: ArrayBuffer) => {
//   state.network.peers.forEach((peer) => {
//     postMessage({
//       type: WorkerMessageType.UnreliableNetworkMessage,
//       peerId,
//       packet,
//     });
//   });
// };

export function createOutgoingNetworkSystem(state: GameState) {
  const cursorView = createCursorView();
  const input: NetPipeData = [state, cursorView];
  return function OutgoingNetworkSystem(state: GameState) {
    const entered = createNetworkIdQuery(state.world);
    for (let i = 0; i < entered.length; i++) {
      const eid = entered[i];
      Networked.networkId[eid] = createNetworkId(state) || 0;
      console.log("new net id -", "nid", Networked.networkId[eid], " eid", eid);
    }
    const exited = deleteNetworkIdQuery(state.world);
    for (let i = 0; i < exited.length; i++) {
      const eid = exited[i];
      deleteNetworkId(state, Networked.networkId[eid]);
      Networked.networkId[eid] = NOOP;
    }

    // reliably send full messages for now
    const msg = createFullChangedMessage(input);
    if (msg.byteLength) broadcastReliable(state, msg);

    // todo: send snapshot for newly seen clients
    // const newClients = getNewClients(state);
    // const snapshotMsg = createSnapshotMessage(input);
    // broadcastReliable(state, msg);

    // todo: reliably send creates
    // const createMsg = createCreateMessage(input);
    // broadcastReliable(state, createMsg)

    // todo: reliably send deletes
    // const deleteMsg = createDeleteMessage(input);
    // broadcastReliable(state, deleteMsg);

    // todo: unreliably send changed updates
    // const updateMsg = createUpdateChangedMessage(input);
    // broadcastUneliable(state, updateMsg);
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
  while (state.network.messages.length) {
    const msg = state.network.messages.pop();
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

  return function IncomingNetworkSystem(state: GameState) {
    processNetworkMessages(state);
  };
}
