import { addComponent, pipe, removeComponent } from "bitecs";

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
  writeUint32,
  writeUint8,
} from "../allocator/CursorView";
import {
  createRemotePositionalAudioEmitter,
  createRemoteMediaStreamSource,
  createRemoteMediaStream,
} from "../audio/audio.game";
import { OurPlayer, ourPlayerQuery, Player } from "../component/Player";
import { addChild, skipRenderLerp, removeRecursive, Transform, Hidden } from "../component/transform";
import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { addRemoteNodeComponent } from "../node/node.game";
import { PhysicsModule, PhysicsModuleState, RigidBody } from "../physics/physics.game";
import { Prefab, createPrefabEntity } from "../prefab/prefab.game";
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
import { GameInputModule, InputModule } from "../input/input.game";
import { setActiveInputController } from "../input/InputController";
import { setActiveCamera } from "../camera/camera.game";
import { createRemoteNametag } from "../nametag/nametag.game";
import { getNametag, NametagComponent } from "../../plugins/nametags/nametags.game";
import { removeInteractableComponent } from "../../plugins/interaction/interaction.game";
import { getAvatar } from "../../plugins/avatars/getAvatar";
import { isHost } from "./network.common";
import { waitUntil } from "../utils/waitUntil";

export type NetPipeData = [GameState, CursorView, string];

// ad-hoc messages view
const messageView = createCursorView(new ArrayBuffer(1000));

export const writeMessageType = (type: NetworkAction) => (input: NetPipeData) => {
  const [, v] = input;
  writeUint8(v, type);
  return input;
};

export const writeElapsed = (input: NetPipeData) => {
  const [ctx, v] = input;
  writeFloat32(v, ctx.elapsed);
  return input;
};

export const writeMetadata = (type: NetworkAction) => pipe(writeMessageType(type), writeElapsed);

const _out: { type: number; elapsed: number } = { type: 0, elapsed: 0 };
export const readMetadata = (v: CursorView, out = _out) => {
  out.type = readUint8(v);
  out.elapsed = readFloat32(v);
  return out;
};

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
  // (v, eid) => writePropIfChanged(v, Networked.networkId, Transform.parent[eid]),
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
  // (v, eid) => (eid ? (Networked.parent[eid] = readUint32(v)) : skipUint32(v)),
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
export function createRemoteNetworkedEntity(ctx: GameState, network: GameNetworkState, nid: number, prefab: string) {
  const eid = createPrefabEntity(ctx, prefab, true);

  // assign networkId
  addComponent(ctx.world, Networked, eid, true);
  Networked.networkId[eid] = nid;
  network.networkIdToEntityId.set(nid, eid);

  // add to scene
  addChild(ctx.activeScene, eid);

  return eid;
}

export function serializeCreatesSnapshot(input: NetPipeData) {
  const [state, v] = input;
  const entities = ownedNetworkedQuery(state.world);
  // TODO: optimize length written with maxEntities config
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const prefabName = Prefab.get(eid) || "cube";
    if (prefabName) {
      writeUint32(v, nid);
      writeString(v, prefabName);
    } else {
      throw new Error(`could not write entity prefab name, ${eid} does not exist in entityPrefabMap`);
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
      console.info("serializing creation for nid", nid, "eid", eid, "prefab", prefabName);
    } else {
      throw new Error(`could not write entity prefab name, ${eid} does not exist in entityPrefabMap`);
    }
  }
  return input;
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
    console.info("deserializing creation - nid", nid, "eid", eid, "prefab", prefabName);
  }
  return input;
}

/* Updates - Snapshot */

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

    // if eid is undefined, this skips reading and moves the view cursor forward by the appropriate amount
    deserializeTransformSnapshot(v, eid);

    if (eid && Transform.skipLerp[eid]) {
      skipRenderLerp(state, eid);
    }
  }
  return input;
}

/* Updates - Changed */

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
    console.info("serialized deletion for nid", nid, "eid", eid);
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
      console.info("deserialized deletion for nid", nid, "eid", eid);
      removeRecursive(state.world, eid);
      network.networkIdToEntityId.delete(nid);
    }
  }
  return input;
}

/* Update NetworkId Message */

export const serializeUpdateNetworkId = (from: number, to: number) => (data: NetPipeData) => {
  console.info("serializeUpdateNetworkId", from, "->", to);
  const [, cv] = data;
  writeUint32(cv, from);
  writeUint32(cv, to);
  return data;
};
export function deserializeUpdateNetworkId(data: NetPipeData) {
  const [ctx, cv] = data;
  const network = getModule(ctx, NetworkModule);

  const from = readUint32(cv);
  const to = readUint32(cv);

  const eid = network.networkIdToEntityId.get(from);
  if (!eid) throw new Error("could not find entity for nid: " + from);

  Networked.networkId[eid] = to;

  console.info("deserializeUpdateNetworkId", from, "->", to);

  return data;
}
export function createUpdateNetworkIdMessage(ctx: GameState, from: number, to: number) {
  const input: NetPipeData = [ctx, messageView, ""];
  writeMetadata(NetworkAction.UpdateNetworkId)(input);
  serializeUpdateNetworkId(from, to)(input);
  return sliceCursorView(messageView);
}

/* Player NetworkId Message */

export const serializeInformPlayerNetworkId = (peerId: string) => (data: NetPipeData) => {
  console.info("serializeInformPlayerNetworkId", peerId);
  const [state, cv] = data;
  const network = getModule(state, NetworkModule);
  const peerEid = network.peerIdToEntityId.get(peerId);
  if (peerEid === undefined) {
    throw new Error(`could not send NetworkMessage.InformPlayerNetworkId, ${peerId} not set on peerIdToEntity map`);
  }

  const peerNid = Networked.networkId[peerEid];
  if (peerNid === NOOP) {
    throw new Error(`could not send NetworkMessage.InformPlayerNetworkId, ${peerEid} has no networkId assigned`);
  }

  writeString(cv, peerId);
  writeUint32(cv, peerNid);

  return data;
};
export async function deserializeInformPlayerNetworkId(data: NetPipeData) {
  const [ctx, cv] = data;

  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);

  // read
  const peerId = readString(cv);
  const peerNid = readUint32(cv);

  console.info("deserializeInformPlayerNetworkId for peer", peerId, peerNid);

  // BUG: entity creation message is parsed after this message for some reason
  // HACK: await the entity's creation
  const peid = await waitUntil<number>(() => network.networkIdToEntityId.get(peerNid));

  associatePeerWithEntity(network, peerId, peid);

  addComponent(ctx.world, Player, peid);

  // if our own avatar
  if (network.authoritative && !isHost(network) && peerId === network.peerId) {
    // unset our old avatar
    const old = ourPlayerQuery(ctx.world)[0];
    removeComponent(ctx.world, OurPlayer, old);
    removeComponent(ctx.world, RigidBody, old);
    removeComponent(ctx.world, Networked, old);

    // embody new avatar
    embodyAvatar(ctx, physics, input, peid);
  }

  if (peerId !== network.peerId) {
    // if not our own avatar, add voip
    addRemoteNodeComponent(ctx, peid, {
      name: peerId,
      audioEmitter: createRemotePositionalAudioEmitter(ctx, {
        sources: [
          createRemoteMediaStreamSource(ctx, {
            stream: createRemoteMediaStream(ctx, { streamId: peerId }),
          }),
        ],
      }),
      nametag: createRemoteNametag(ctx, {
        name: peerId,
      }),
    });
  }

  return data;
}
export function createInformPlayerNetworkIdMessage(ctx: GameState, peerId: string) {
  const input: NetPipeData = [ctx, messageView, ""];
  writeMetadata(NetworkAction.InformPlayerNetworkId)(input);
  serializeInformPlayerNetworkId(peerId)(input);
  return sliceCursorView(messageView);
}

// TODO: move this to a plugin (along with InformPlayerNetworkId OR register another hook into InformPlayerNetworkId)
export function embodyAvatar(ctx: GameState, physics: PhysicsModuleState, input: GameInputModule, eid: number) {
  // remove the nametag
  try {
    const nametag = getNametag(ctx, eid);
    removeComponent(ctx.world, NametagComponent, nametag);
  } catch {}

  // hide our avatar
  try {
    const avatar = getAvatar(ctx, eid);
    addComponent(ctx.world, Hidden, avatar);
  } catch {}

  // mark entity as our player entity
  addComponent(ctx.world, OurPlayer, eid);

  // disable the collision group so we are unable to focus our own rigidbody
  removeInteractableComponent(ctx, physics, eid);

  // set the active camera & input controller to this entity's
  setActiveCamera(ctx, eid);
  setActiveInputController(input, eid);
}

/* Message Factories */

// New Peer Snapshot Update
export const createNewPeerSnapshotMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  writeMetadata(NetworkAction.NewPeerSnapshot),
  serializeCreatesSnapshot,
  serializeUpdatesSnapshot,
  ([, v]) => sliceCursorView(v)
);

export const deserializeNewPeerSnapshot = pipe(deserializeCreates, deserializeUpdatesSnapshot);

// Full Snapshot Update
export const createFullSnapshotMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  writeMetadata(NetworkAction.FullSnapshot),
  serializeCreatesSnapshot,
  serializeUpdatesSnapshot,
  ([, v]) => {
    if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 2 * Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

export const deserializeSnapshot = pipe(deserializeCreates, deserializeUpdatesSnapshot);

// Changed State Update
export const createFullChangedMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  writeMetadata(NetworkAction.FullChanged),
  serializeCreates,
  serializeUpdatesChanged,
  serializeDeletes,
  ([, v]) => {
    if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 3 * Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

// Deletion Update
export const createDeleteMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  writeMetadata(NetworkAction.Delete),
  serializeDeletes,
  ([, v]) => {
    if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 1 * Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

// deserialization
export const deserializeFullUpdate = pipe(deserializeCreates, deserializeUpdatesChanged, deserializeDeletes);

// unused

// export const createCreateMessage: (input: NetPipeData) => ArrayBuffer = pipe(
//   writeMetadata(NetworkAction.Create),
//   serializeCreates,
//   ([, v]) => {
//     if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 1 * Uint32Array.BYTES_PER_ELEMENT) {
//       moveCursorView(v, 0);
//     }
//     return sliceCursorView(v);
//   }
// );

// export const createUpdateChangedMessage: (input: NetPipeData) => ArrayBuffer = pipe(
//   writeMetadata(NetworkAction.UpdateChanged),
//   serializeUpdatesChanged,
//   ([, v]) => {
//     if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 1 * Uint32Array.BYTES_PER_ELEMENT) {
//       moveCursorView(v, 0);
//     }
//     return sliceCursorView(v);
//   }
// );

// export const createUpdateSnapshotMessage: (input: NetPipeData) => ArrayBuffer = pipe(
//   writeMetadata(NetworkAction.UpdateSnapshot),
//   serializeUpdatesSnapshot,
//   ([, v]) => {
//     if (v.cursor <= Uint8Array.BYTES_PER_ELEMENT + 1 * Uint32Array.BYTES_PER_ELEMENT) {
//       moveCursorView(v, 0);
//     }
//     return sliceCursorView(v);
//   }
// );
