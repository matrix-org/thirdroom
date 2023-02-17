import { Quaternion, Vector3 } from "three";
import { addComponent, pipe, removeComponent } from "bitecs";

import {
  createCursorView,
  CursorView,
  moveCursorView,
  readFloat32,
  readFloat64,
  readString,
  readUint16,
  readUint32,
  readUint8,
  rewindCursorView,
  scrollCursorView,
  skipFloat32,
  skipUint32,
  sliceCursorView,
  spaceUint16,
  spaceUint32,
  spaceUint8,
  writeFloat32,
  writeFloat64,
  writePropIfChanged,
  writeScalarPropIfChanged,
  writeString,
  writeUint32,
  writeUint8,
} from "../allocator/CursorView";
import { OurPlayer, ourPlayerQuery, Player } from "../component/Player";
import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { PhysicsModule, PhysicsModuleState, RigidBody } from "../physics/physics.game";
import { Prefab, createPrefabEntity } from "../prefab/prefab.game";
import { checkBitflag } from "../utils/checkBitflag";
import {
  ownedNetworkedQuery,
  createdOwnedNetworkedQuery,
  GameNetworkState,
  deletedOwnedNetworkedQuery,
  associatePeerWithEntity,
} from "./network.game";
import { Networked } from "./NetworkComponents";
import { NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { GameInputModule, InputModule } from "../input/input.game";
import { setActiveInputController } from "../input/InputController";
import { getCamera } from "../camera/camera.game";
import { addNametag, getNametag, NametagAnchor } from "../../plugins/nametags/nametags.game";
import { removeInteractableComponent } from "../../plugins/interaction/interaction.game";
import { isHost } from "./network.common";
import { waitUntil } from "../utils/waitUntil";
import { AudioEmitterType } from "../resource/schema";
import { getRemoteResource, tryGetRemoteResource } from "../resource/resource.game";
import {
  addObjectToWorld,
  RemoteAudioData,
  RemoteAudioEmitter,
  RemoteAudioSource,
  RemoteNode,
  removeObjectFromWorld,
} from "../resource/RemoteResources";
import { AVATAR_HEIGHT, AVATAR_OFFSET } from "../../plugins/avatars/common";
import { XRMode } from "../renderer/renderer.common";
import { AvatarComponent } from "../../plugins/avatars/components";
import { addXRAvatarRig } from "../input/WebXRAvatarRigSystem";

export type NetPipeData = [GameState, CursorView, string];

// ad-hoc messages view
const messageView = createCursorView(new ArrayBuffer(10000));

const metadataTotalBytes =
  Uint8Array.BYTES_PER_ELEMENT + Float64Array.BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT;

export const writeMessageType = (type: NetworkAction) => (input: NetPipeData) => {
  const [, v] = input;
  writeUint8(v, type);
  return input;
};

export const writeElapsed = (input: NetPipeData) => {
  const [, v] = input;
  writeFloat64(v, Date.now());
  return input;
};

export const writeMetadata = (type: NetworkAction) =>
  pipe(
    // ui8
    writeMessageType(type),
    // f64
    writeElapsed,
    // HACK: leave space for the input tick
    (data) => {
      const [, v] = data;
      scrollCursorView(v, Uint32Array.BYTES_PER_ELEMENT);
      return data;
    }
  );

const _out: { type: number; elapsed: number; inputTick: number } = { type: 0, elapsed: 0, inputTick: 0 };
export const readMetadata = (v: CursorView, out = _out) => {
  out.type = readUint8(v);
  out.elapsed = readFloat64(v);
  // HACK?: read input tick processed from this peer to each packet
  out.inputTick = readUint32(v);
  return out;
};

/* Transform serialization */

export const serializeTransformSnapshot = (v: CursorView, node: RemoteNode) => {
  const eid = node.eid;

  const position = node.position;
  writeFloat32(v, position[0]);
  writeFloat32(v, position[1]);
  writeFloat32(v, position[2]);

  const velocity = RigidBody.velocity[eid];
  writeFloat32(v, velocity[0]);
  writeFloat32(v, velocity[1]);
  writeFloat32(v, velocity[2]);

  const quaternion = node.quaternion;
  writeFloat32(v, quaternion[0]);
  writeFloat32(v, quaternion[1]);
  writeFloat32(v, quaternion[2]);
  writeFloat32(v, quaternion[3]);

  const skipLerp = node.skipLerp;
  writeUint32(v, skipLerp);

  return v;
};

export const deserializeTransformSnapshot = (v: CursorView, node: RemoteNode | undefined) => {
  if (node !== undefined) {
    const eid = node.eid;
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

    node.skipLerp = readUint32(v);
  } else {
    scrollCursorView(v, Float32Array.BYTES_PER_ELEMENT * 10 + Uint32Array.BYTES_PER_ELEMENT);
  }

  return v;
};

const defineChangedSerializer = (...fns: ((ctx: GameState, v: CursorView, eid: number) => boolean)[]) => {
  const spacer = fns.length <= 8 ? spaceUint8 : fns.length <= 16 ? spaceUint16 : spaceUint32;
  return (ctx: GameState, v: CursorView, eid: number) => {
    const writeChangeMask = spacer(v);
    let changeMask = 0;
    let b = 0;
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      changeMask |= fn(ctx, v, eid) ? 1 << b++ : b++ && 0;
    }
    writeChangeMask(changeMask);
    return changeMask > 0;
  };
};

export const serializeTransformChanged = defineChangedSerializer(
  (ctx, v, eid) => writePropIfChanged(v, tryGetRemoteResource<RemoteNode>(ctx, eid).position, 0),
  (ctx, v, eid) => writePropIfChanged(v, tryGetRemoteResource<RemoteNode>(ctx, eid).position, 1),
  (ctx, v, eid) => writePropIfChanged(v, tryGetRemoteResource<RemoteNode>(ctx, eid).position, 2),
  (ctx, v, eid) => writePropIfChanged(v, RigidBody.velocity[eid], 0),
  (ctx, v, eid) => writePropIfChanged(v, RigidBody.velocity[eid], 1),
  (ctx, v, eid) => writePropIfChanged(v, RigidBody.velocity[eid], 2),
  (ctx, v, eid) => writePropIfChanged(v, tryGetRemoteResource<RemoteNode>(ctx, eid).quaternion, 0),
  (ctx, v, eid) => writePropIfChanged(v, tryGetRemoteResource<RemoteNode>(ctx, eid).quaternion, 1),
  (ctx, v, eid) => writePropIfChanged(v, tryGetRemoteResource<RemoteNode>(ctx, eid).quaternion, 2),
  (ctx, v, eid) => writePropIfChanged(v, tryGetRemoteResource<RemoteNode>(ctx, eid).quaternion, 3),
  // (ctx, v, eid) => writePropIfChanged(v, Networked.networkId, Transform.parent[eid]),
  (ctx, v, eid) =>
    writeScalarPropIfChanged(v, "skipLerp", Uint32Array, tryGetRemoteResource<RemoteNode>(ctx, eid).skipLerp)
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

// NOTE: if eid is NOOP the deserializer will write all data to the NOOP entity
// this effectively nullifies the update, but still moves the view's cursor forward so the rest of the message is read properly
export const defineChangedDeserializer = (...fns: ((ctx: GameState, v: CursorView, eid: number) => void)[]) => {
  const readChangeMask = fns.length <= 8 ? readUint8 : fns.length <= 16 ? readUint16 : readUint32;
  return (ctx: GameState, v: CursorView, eid: number) => {
    const changeMask = readChangeMask(v);
    let b = 0;
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      if (checkBitflag(changeMask, 1 << b++)) fn(ctx, v, eid);
    }
  };
};

export const deserializeTransformChanged = defineChangedDeserializer(
  (ctx, v, eid) => (eid ? (Networked.position[eid][0] = readFloat32(v)) : skipFloat32(v)),
  (ctx, v, eid) => (eid ? (Networked.position[eid][1] = readFloat32(v)) : skipFloat32(v)),
  (ctx, v, eid) => (eid ? (Networked.position[eid][2] = readFloat32(v)) : skipFloat32(v)),
  (ctx, v, eid) => (eid ? (Networked.velocity[eid][0] = readFloat32(v)) : skipFloat32(v)),
  (ctx, v, eid) => (eid ? (Networked.velocity[eid][1] = readFloat32(v)) : skipFloat32(v)),
  (ctx, v, eid) => (eid ? (Networked.velocity[eid][2] = readFloat32(v)) : skipFloat32(v)),
  (ctx, v, eid) => (eid ? (Networked.quaternion[eid][0] = readFloat32(v)) : skipFloat32(v)),
  (ctx, v, eid) => (eid ? (Networked.quaternion[eid][1] = readFloat32(v)) : skipFloat32(v)),
  (ctx, v, eid) => (eid ? (Networked.quaternion[eid][2] = readFloat32(v)) : skipFloat32(v)),
  (ctx, v, eid) => (eid ? (Networked.quaternion[eid][3] = readFloat32(v)) : skipFloat32(v)),
  // (ctx, v, eid) => (eid ? (Networked.parent[eid] = readUint32(v)) : skipUint32(v)),
  (ctx, v, eid) => (eid ? (tryGetRemoteResource<RemoteNode>(ctx, eid).skipLerp = readUint32(v)) : skipUint32(v))
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
export function createRemoteNetworkedEntity(
  ctx: GameState,
  network: GameNetworkState,
  nid: number,
  prefab: string
): RemoteNode {
  const node = createPrefabEntity(ctx, prefab);

  // assign networkId
  addComponent(ctx.world, Networked, node.eid, true);
  Networked.networkId[node.eid] = nid;
  network.networkIdToEntityId.set(nid, node.eid);
  addObjectToWorld(ctx, node);

  return node;
}

export function serializeCreatesSnapshot(input: NetPipeData) {
  const [state, v] = input;
  const entities = ownedNetworkedQuery(state.world);
  // TODO: optimize length written with maxEntities config
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const prefabName = Prefab.get(eid);
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
    const prefabName = Prefab.get(eid);
    if (prefabName) {
      writeUint32(v, nid);
      writeString(v, prefabName);
      console.info("serializing creation for nid", nid, "eid", eid, "prefab", prefabName);
    } else {
      throw new Error(`could not serialize creations, ${eid} has no prefab`);
    }
  }
  return input;
}

export function deserializeCreates(input: NetPipeData) {
  const [ctx, v] = input;
  const network = getModule(ctx, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const prefabName = readString(v);
    const existingEntity = network.networkIdToEntityId.get(nid);
    if (existingEntity) continue;

    const obj = createRemoteNetworkedEntity(ctx, network, nid, prefabName);
    console.info("deserializing creation - nid", nid, "eid", obj.eid, "prefab", prefabName);
  }
  return input;
}

/* Updates - Snapshot */

export function serializeUpdatesSnapshot(input: NetPipeData) {
  const [ctx, v] = input;
  const entities = ownedNetworkedQuery(ctx.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    writeUint32(v, nid);
    serializeTransformSnapshot(v, node);
  }
  return input;
}

export function deserializeUpdatesSnapshot(input: NetPipeData) {
  const [ctx, v] = input;
  const network = getModule(ctx, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = network.networkIdToEntityId.get(nid) || NOOP;
    const node = eid ? getRemoteResource<RemoteNode>(ctx, eid) : undefined;

    if (node === undefined) {
      console.warn(`could not deserialize update for non-existent entity for networkId ${nid}`);
    }

    deserializeTransformSnapshot(v, node);

    if (node && node.skipLerp) {
      node.skipLerp = 10;
    }
  }
  return input;
}

/* Updates - Changed */

export function serializeUpdatesChanged(input: NetPipeData) {
  const [ctx, v] = input;
  const entities = ownedNetworkedQuery(ctx.world);
  const writeCount = spaceUint32(v);
  let count = 0;
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const rewind = rewindCursorView(v);
    const writeNid = spaceUint32(v);
    const written = serializeTransformChanged(ctx, v, eid);
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
  const [ctx, v] = input;
  const network = getModule(ctx, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    let eid = network.networkIdToEntityId.get(nid) || NOOP;

    if (eid === NOOP) {
      console.warn(`could not deserialize update for non-existent entity for networkId ${nid}`);
    }

    if (network.authoritative && !isHost(network)) {
      // HACK: if this update is for our avatar, skip it until CSP is fixed
      const peerId = network.entityIdToPeerId.get(eid);
      // deserialize onto noop entity to move the cursor forward
      if (peerId === network.peerId) eid = 0;
    }

    deserializeTransformChanged(ctx, v, eid);
  }
  return input;
}

/* Delete */

export function serializeDeletes(input: NetPipeData) {
  const [ctx, v] = input;
  const entities = deletedOwnedNetworkedQuery(ctx.world);
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
  const [ctx, v] = input;
  const network = getModule(ctx, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = network.networkIdToEntityId.get(nid);
    const node = eid ? getRemoteResource<RemoteNode>(ctx, eid) : undefined;
    if (!node) {
      console.warn(`could not remove networkId ${nid}, no matching entity`);
    } else {
      console.info("deserialized deletion for nid", nid, "eid", eid);
      removeObjectFromWorld(ctx, node);
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

  const peerNode = getRemoteResource<RemoteNode>(ctx, peid)!;

  peerNode.audioEmitter = new RemoteAudioEmitter(ctx.resourceManager, {
    type: AudioEmitterType.Positional,
    sources: [
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-01.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-02.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-03.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-04.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, {
          uri: `mediastream:${peerId}`,
        }),
        autoPlay: true,
      }),
    ],
  });

  peerNode.name = peerId;

  // if not our own avatar, add nametag
  if (peerId !== network.peerId) {
    addNametag(ctx, AVATAR_HEIGHT + AVATAR_OFFSET, peerNode, peerId);
  }

  // if our own avatar
  if (network.authoritative && !isHost(network) && peerId === network.peerId) {
    // unset our old avatar
    // TODO: actually remove this entity. this leaks atm, but fixes a bug when removing the entire node
    const old = ourPlayerQuery(ctx.world)[0];
    removeComponent(ctx.world, OurPlayer, old);
    removeComponent(ctx.world, RigidBody, old);
    removeComponent(ctx.world, Networked, old);

    // embody new avatar
    embodyAvatar(ctx, physics, input, peerNode);
  }

  return data;
}

export function createInformXRMode(ctx: GameState, xrMode: XRMode) {
  const data: NetPipeData = [ctx, messageView, ""];
  writeMetadata(NetworkAction.InformXRMode)(data);

  serializeInformXRMode(data, xrMode);

  return sliceCursorView(messageView);
}
export const serializeInformXRMode = (data: NetPipeData, xrMode: XRMode) => {
  const [, v] = data;
  writeUint8(v, xrMode);
  return data;
};
export const deserializeInformXRMode = (data: NetPipeData) => {
  const [ctx, v, peerId] = data;
  const network = getModule(ctx, NetworkModule);

  // read
  const xrMode = readUint8(v);

  console.log(`deserializeInformXRMode - peerId: ${peerId}; xrMode: ${xrMode}`);

  // effect
  network.peerIdToXRMode.set(peerId, xrMode);

  return data;
};

export function createInformPlayerNetworkIdMessage(ctx: GameState, peerId: string) {
  const input: NetPipeData = [ctx, messageView, ""];
  writeMetadata(NetworkAction.InformPlayerNetworkId)(input);
  serializeInformPlayerNetworkId(peerId)(input);
  return sliceCursorView(messageView);
}

// TODO: move this to a plugin (along with InformPlayerNetworkId OR register another hook into InformPlayerNetworkId)
export function embodyAvatar(ctx: GameState, physics: PhysicsModuleState, input: GameInputModule, node: RemoteNode) {
  // remove the nametag
  try {
    const nametag = getNametag(ctx, node);
    removeComponent(ctx.world, NametagAnchor, nametag.eid);
  } catch {}

  // hide our avatar
  try {
    const avatarEid = AvatarComponent.eid[node.eid];
    const avatar = tryGetRemoteResource<RemoteNode>(ctx, avatarEid);
    avatar.visible = false;
  } catch {}

  // mark entity as our player entity
  addComponent(ctx.world, OurPlayer, node.eid);

  // disable the collision group so we are unable to focus our own rigidbody
  removeInteractableComponent(ctx, physics, node);

  // set the active camera & input controller to this entity's
  ctx.worldResource.activeCameraNode = getCamera(ctx, node);
  ctx.worldResource.activeAvatarNode = node;

  addXRAvatarRig(ctx.world, node.eid);
  setActiveInputController(input, node.eid);
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
  serializeCreates,
  serializeUpdatesSnapshot,
  serializeDeletes,
  ([, v]) => {
    if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT * 3) {
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
    if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT * 3) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

export const deserializeFullChangedUpdate = pipe(deserializeCreates, deserializeUpdatesChanged, deserializeDeletes);

// Deletion Update
export const createDeleteMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  writeMetadata(NetworkAction.Delete),
  serializeDeletes,
  ([, v]) => {
    if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

export const createCreateMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  writeMetadata(NetworkAction.Create),
  serializeCreates,
  ([, v]) => {
    if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

export const createUpdateChangedMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  writeMetadata(NetworkAction.UpdateChanged),
  serializeUpdatesChanged,
  ([, v]) => {
    if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

export const createUpdateSnapshotMessage: (input: NetPipeData) => ArrayBuffer = pipe(
  writeMetadata(NetworkAction.UpdateSnapshot),
  serializeUpdatesSnapshot,
  ([, v]) => {
    if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
      moveCursorView(v, 0);
    }
    return sliceCursorView(v);
  }
);

export function createClientPositionMessage(ctx: GameState, eid: number) {
  const data: NetPipeData = [ctx, messageView, ""];

  const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
  const camera = getCamera(ctx, node).parent!;

  writeMetadata(NetworkAction.ClientPosition)(data);

  writeUint32(messageView, Networked.networkId[node.eid]);

  // transform
  writeFloat32(messageView, node.position[0]);
  writeFloat32(messageView, node.position[1]);
  writeFloat32(messageView, node.position[2]);

  writeFloat32(messageView, node.quaternion[0]);
  writeFloat32(messageView, node.quaternion[1]);
  writeFloat32(messageView, node.quaternion[2]);
  writeFloat32(messageView, node.quaternion[3]);

  // physics
  writeFloat32(messageView, RigidBody.velocity[eid][0]);
  writeFloat32(messageView, RigidBody.velocity[eid][1]);
  writeFloat32(messageView, RigidBody.velocity[eid][2]);

  // camera
  writeFloat32(messageView, camera.quaternion[0]);
  writeFloat32(messageView, camera.quaternion[1]);
  writeFloat32(messageView, camera.quaternion[2]);
  writeFloat32(messageView, camera.quaternion[3]);

  return sliceCursorView(messageView);
}

const _p = new Vector3();
const _v = new Vector3();
const _q = new Quaternion();
export function deserializeClientPosition(data: NetPipeData) {
  const [ctx, view] = data;

  const network = getModule(ctx, NetworkModule);

  const nid = readUint32(view);
  const player = network.networkIdToEntityId.get(nid)!;
  const node = tryGetRemoteResource<RemoteNode>(ctx, player);
  const camera = getCamera(ctx, node).parent!;

  const body = RigidBody.store.get(node.eid);

  _p.x = readFloat32(view);
  _p.y = readFloat32(view);
  _p.z = readFloat32(view);

  _q.x = readFloat32(view);
  _q.y = readFloat32(view);
  _q.z = readFloat32(view);
  _q.w = readFloat32(view);

  _v.x = readFloat32(view);
  _v.y = readFloat32(view);
  _v.z = readFloat32(view);

  camera.quaternion[0] = readFloat32(view);
  camera.quaternion[1] = readFloat32(view);
  camera.quaternion[2] = readFloat32(view);
  camera.quaternion[3] = readFloat32(view);

  body?.setTranslation(_p, true);
  body?.setLinvel(_v, true);
  body?.setRotation(_q, true);

  return data;
}
