import { addComponent, pipe } from "bitecs";

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
  skipUint8,
  sliceCursorView,
  spaceUint16,
  spaceUint32,
  spaceUint8,
  writeFloat32,
  writePropIfChanged,
  writeString,
  writeUint16,
  writeUint32,
  writeUint8,
} from "../allocator/CursorView";
import {
  createRemotePositionalAudioEmitter,
  createRemoteMediaStreamSource,
  createRemoteMediaStream,
} from "../audio/audio.game";
import { Player } from "../component/Player";
import { addChild, skipRenderLerp, removeRecursive, Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { createRemoteNametag } from "../nametag/nametag.game";
import { RemoteNodeComponent } from "../node/node.game";
import { RigidBody } from "../physics/physics.game";
import { Prefab, createPrefabEntity, addPrefabComponent } from "../prefab/prefab.game";
import { checkBitflag } from "../utils/checkBitflag";
import {
  Networked,
  ownedNetworkedQuery,
  createdOwnedNetworkedQuery,
  GameNetworkState,
  deletedOwnedNetworkedQuery,
  associatePeerWithEntity,
} from "./network.game";
import { NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";

export type NetPipeData = [GameState, CursorView];

export const writeElapsed = (input: NetPipeData) => {
  const [ctx, v] = input;
  writeFloat32(v, ctx.elapsed);
  return input;
};

export const writeMessageType = (type: NetworkAction) => (input: NetPipeData) => {
  const [, v] = input;
  writeUint8(v, type);
  return input;
};

export const writeMetadata = (type: NetworkAction) => pipe(writeMessageType(type), writeElapsed);

/* Transform serialization */

export const serializeTransformSnapshot = (v: CursorView, eid: number) => {
  const position = Transform.position[eid];
  writeFloat32(v, position[0]);
  writeFloat32(v, position[1]);
  writeFloat32(v, position[2]);

  const velocity = RigidBody.velocity[eid];
  writeFloat32(v, velocity[0]);
  writeFloat32(v, velocity[1]);
  writeFloat32(v, velocity[2]);

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
    position[0] = readFloat32(v);
    position[1] = readFloat32(v);
    position[2] = readFloat32(v);

    const velocity = Networked.velocity[eid];
    velocity[0] = readFloat32(v);
    velocity[1] = readFloat32(v);
    velocity[2] = readFloat32(v);

    const quaternion = Networked.quaternion[eid];
    quaternion[0] = readFloat32(v);
    quaternion[1] = readFloat32(v);
    quaternion[2] = readFloat32(v);
    quaternion[3] = readFloat32(v);
  } else {
    scrollCursorView(v, Float32Array.BYTES_PER_ELEMENT * 7);
  }

  return v;
};

// todo: bench performance of defineChangedSerializer vs raw function
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
  (v, eid) => writePropIfChanged(v, Transform.quaternion[eid], 3),
  (v, eid) => writePropIfChanged(v, Transform.skipLerp, eid)
);

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

// todo: bench performance of defineChangedSerializer vs raw function
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
  (v, eid) => (eid ? (Networked.quaternion[eid][3] = readFloat32(v)) : skipFloat32(v)),
  (v, eid) => (eid ? (Transform.skipLerp[eid] = readUint8(v)) : skipUint8(v))
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
    const prefabName = Prefab.get(eid) || "cube";
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
    const prefabName = Prefab.get(eid) || "cube";
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

export function createRemoteNetworkedEntity(state: GameState, network: GameNetworkState, nid: number, prefab: string) {
  const eid = createPrefabEntity(state, prefab, true);

  // assign networkId
  addComponent(state.world, Networked, eid, true);
  Networked.networkId[eid] = nid;
  network.networkIdToEntityId.set(nid, eid);

  // assign prefab
  addPrefabComponent(state.world, eid, prefab);

  // add to scene
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
    const eid = createRemoteNetworkedEntity(state, network, nid, prefabName);
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

    if (eid === undefined) {
      console.warn(`could not deserialize update for non-existent entity for networkId ${nid}`);
    }

    deserializeTransformSnapshot(v, eid);

    if (eid && Transform.skipLerp[eid]) {
      skipRenderLerp(state, eid);
    }
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
      removeRecursive(state.world, eid);
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
  writeUint16(v, peerIdIndex);

  return input;
}

// peer decodes the peerIdIndex
export function deserializePeerIdIndex(input: NetPipeData) {
  const [state, v] = input;
  const network = getModule(state, NetworkModule);
  const peerId = readString(v);
  const peerIdIndex = readUint16(v);

  network.peerIdToIndex.set(peerId, peerIdIndex);
  network.indexToPeerId.set(peerIdIndex, peerId);
  console.log("recieving peerIdIndex", peerId, peerIdIndex);
  return input;
}

// ad-hoc messages view
const messageView = createCursorView(new ArrayBuffer(1000));

export function createPeerIdIndexMessage(state: GameState, peerId: string) {
  const input: NetPipeData = [state, messageView];
  writeMessageType(NetworkAction.AssignPeerIdIndex)(input);
  writeElapsed(input);
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
    associatePeerWithEntity(network, peerId, peid);
    console.log("deserializePlayerNetworkId", network.peerIdToEntityId);

    const remoteNode = RemoteNodeComponent.get(peid);

    if (!remoteNode) {
      throw new Error(`Couldn't find remote node for networked entity: ${peid} peerId: ${peerId}`);
    }

    addComponent(state.world, Player, peid);

    remoteNode.name = peerId;

    remoteNode.audioEmitter = createRemotePositionalAudioEmitter(state, {
      sources: [
        createRemoteMediaStreamSource(state, {
          stream: createRemoteMediaStream(state, { streamId: peerId }),
        }),
      ],
    });

    remoteNode.nametag = createRemoteNametag(state, {
      name: peerId,
    });
  } else {
    console.error("could not find peer's entityId within network.networkIdToEntityId");
  }

  return input;
}

export function createPlayerNetworkIdMessage(state: GameState) {
  const input: NetPipeData = [state, messageView];
  writeMessageType(NetworkAction.InformPlayerNetworkId)(input);
  writeElapsed(input);
  serializePlayerNetworkId(input);
  return sliceCursorView(messageView);
}

/* Message Factories */

// playerNetIdMsg + createMsg + deleteMsg
export const createNewPeerSnapshotMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  writeMetadata(NetworkAction.NewPeerSnapshot),
  serializeCreatesSnapshot,
  serializeUpdatesSnapshot,
  serializePlayerNetworkId,
  ([_, v]) => sliceCursorView(v)
);

// reliably send all entities and their data to newly seen clients on-join
export const createFullSnapshotMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  writeMetadata(NetworkAction.FullSnapshot),
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
  writeMetadata(NetworkAction.FullChanged),
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
  writeMetadata(NetworkAction.Create),
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
  writeMetadata(NetworkAction.UpdateChanged),
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
  writeMetadata(NetworkAction.UpdateSnapshot),
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
  writeMetadata(NetworkAction.Delete),
  serializeDeletes,
  ([_, v]) => {
    if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 1 * Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

// deserialization pipelines
export const deserializeNewPeerSnapshot = pipe(
  deserializeCreates,
  deserializeUpdatesSnapshot,
  deserializePlayerNetworkId
);
export const deserializeSnapshot = pipe(deserializeCreates, deserializeUpdatesSnapshot);
export const deserializeFullUpdate = pipe(deserializeCreates, deserializeUpdatesChanged, deserializeDeletes);
