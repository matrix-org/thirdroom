import { Quaternion, Vector3 } from "three";
import { addComponent, removeComponent } from "bitecs";

import {
  createCursorView,
  CursorView,
  moveCursorView,
  readArrayBuffer,
  readFloat32,
  readFloat64,
  readString,
  readUint16,
  readUint32,
  readUint8,
  rewindCursorView,
  scrollCursorView,
  sliceCursorView,
  spaceUint16,
  spaceUint32,
  writeArrayBuffer,
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
import { AVATAR_HEIGHT } from "../../plugins/avatars/common";
import { XRMode } from "../renderer/renderer.common";
import { AvatarRef } from "../../plugins/avatars/components";
import { addXRAvatarRig } from "../input/WebXRAvatarRigSystem";
import { getReplicator } from "./Replicator";

// ad-hoc messages view
const messageView = createCursorView(new ArrayBuffer(10000));

const metadataTotalBytes =
  Uint8Array.BYTES_PER_ELEMENT + Float64Array.BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT;

export const writeMessageType = (v: CursorView, type: NetworkAction) => writeUint8(v, type);

export const writeElapsed = (v: CursorView) => writeFloat64(v, Date.now());

export const writeMetadata = (v: CursorView, type: NetworkAction) => {
  writeMessageType(v, type);
  writeElapsed(v);
  // HACK: leave space for the input tick
  scrollCursorView(v, Uint32Array.BYTES_PER_ELEMENT);
};

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

export const deserializeTransformSnapshot = (
  network: GameNetworkState,
  v: CursorView,
  nid: number,
  node: RemoteNode | undefined
) => {
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
    const deferredUpdates = network.deferredUpdates.get(nid);
    if (deferredUpdates !== undefined) {
      const position = new Float32Array(3);
      position[0] = readFloat32(v);
      position[1] = readFloat32(v);
      position[2] = readFloat32(v);

      const velocity = new Float32Array(3);
      velocity[0] = readFloat32(v);
      velocity[1] = readFloat32(v);
      velocity[2] = readFloat32(v);

      const quaternion = new Float32Array(4);
      quaternion[0] = readFloat32(v);
      quaternion[1] = readFloat32(v);
      quaternion[2] = readFloat32(v);
      quaternion[3] = readFloat32(v);

      deferredUpdates.push({ position, quaternion });
    } else {
      console.warn(`could not deserialize update for non-existent entity for networkID ${nid}`);
      scrollCursorView(v, Float32Array.BYTES_PER_ELEMENT * 10 + Uint32Array.BYTES_PER_ELEMENT);
    }
  }

  return v;
};

export const serializeTransformChanged = (v: CursorView, node: RemoteNode) => {
  const writeChangeMask = spaceUint16(v);
  let changeMask = 0;
  let b = 0;

  const position = node.position;
  changeMask |= writePropIfChanged(v, position, 0) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, position, 1) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, position, 2) ? 1 << b++ : b++ && 0;

  const velocity = RigidBody.velocity[node.eid];
  changeMask |= writePropIfChanged(v, velocity, 0) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, velocity, 1) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, velocity, 2) ? 1 << b++ : b++ && 0;

  const quaternion = node.quaternion;
  changeMask |= writePropIfChanged(v, quaternion, 0) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, quaternion, 1) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, quaternion, 2) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, quaternion, 3) ? 1 << b++ : b++ && 0;

  changeMask |= writeScalarPropIfChanged(v, "skipLerp", Uint32Array, node.skipLerp) ? 1 << b++ : b++ && 0;

  writeChangeMask(changeMask);

  return changeMask > 0;
};

export const deserializeTransformChanged = (v: CursorView, nid: number, node: RemoteNode | undefined) => {
  if (node) {
    const changeMask = readUint16(v);
    let b = 0;

    const position = Networked.position[node.eid];
    if (checkBitflag(changeMask, 1 << b++)) position[0] = readFloat32(v);
    if (checkBitflag(changeMask, 1 << b++)) position[1] = readFloat32(v);
    if (checkBitflag(changeMask, 1 << b++)) position[2] = readFloat32(v);

    const velocity = Networked.velocity[node.eid];
    if (checkBitflag(changeMask, 1 << b++)) velocity[0] = readFloat32(v);
    if (checkBitflag(changeMask, 1 << b++)) velocity[1] = readFloat32(v);
    if (checkBitflag(changeMask, 1 << b++)) velocity[2] = readFloat32(v);

    const quaternion = Networked.quaternion[node.eid];
    if (checkBitflag(changeMask, 1 << b++)) quaternion[0] = readFloat32(v);
    if (checkBitflag(changeMask, 1 << b++)) quaternion[1] = readFloat32(v);
    if (checkBitflag(changeMask, 1 << b++)) quaternion[2] = readFloat32(v);
    if (checkBitflag(changeMask, 1 << b++)) quaternion[3] = readFloat32(v);

    if (checkBitflag(changeMask, 1 << b++)) node.skipLerp = readUint32(v);
  } else {
    console.warn(`could not deserialize transform update for non-existent entity for networkID ${nid}`);
    scrollCursorView(v, Float32Array.BYTES_PER_ELEMENT * 10 + Uint32Array.BYTES_PER_ELEMENT);
  }
};

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

function writeCreation(network: GameNetworkState, v: CursorView, eid: number) {
  const nid = Networked.networkId[eid];

  const prefabName = Prefab.get(eid);
  if (!prefabName) {
    // TODO: gracefully fail and rewind cursor view?
    throw new Error(`could not serialize creation for ${eid}, entity has no prefab`);
  }

  writeUint32(v, nid);
  writeString(v, prefabName);
  const writeDataByteLength = spaceUint32(v);

  const replicator = getReplicator(network, prefabName);
  if (!replicator) {
    writeDataByteLength(0);
    return;
  }

  const data = replicator.eidToData.get(eid);
  writeDataByteLength(data?.byteLength || 0);
  if (data && data.byteLength) {
    writeArrayBuffer(v, data);
  }
}

export function serializeCreatesSnapshot(ctx: GameState, v: CursorView) {
  const network = getModule(ctx, NetworkModule);
  const entities = ownedNetworkedQuery(ctx.world);

  // TODO: optimize length written with maxEntities config
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    writeCreation(network, v, eid);
  }
}

export function serializeCreates(ctx: GameState, v: CursorView) {
  const network = getModule(ctx, NetworkModule);
  const entities = createdOwnedNetworkedQuery(ctx.world);

  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    writeCreation(network, v, eid);
  }
}

export function deserializeCreates(ctx: GameState, v: CursorView, peerId: string) {
  const network = getModule(ctx, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const prefabName = readString(v);
    const dataByteLength = readUint32(v);

    const existingEntity = network.networkIdToEntityId.get(nid);

    if (existingEntity) {
      console.warn(
        `attempted to deserialize the creation of an already existing entity - nid:${nid}; eid:${existingEntity}; prefab:${prefabName}`
      );
      continue;
    }

    const replicator = getReplicator(network, prefabName);
    if (replicator) {
      const data = dataByteLength > 0 ? readArrayBuffer(v, dataByteLength) : undefined;

      replicator.spawned.push({
        networkId: nid,
        peerIndex: network.peerIdToIndex.get(peerId)!,
        data,
      });
      network.deferredUpdates.set(nid, []);
    } else {
      createRemoteNetworkedEntity(ctx, network, nid, prefabName);
    }
  }
}

/* Updates - Snapshot */

export function serializeUpdatesSnapshot(ctx: GameState, v: CursorView) {
  const entities = ownedNetworkedQuery(ctx.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    writeUint32(v, nid);
    serializeTransformSnapshot(v, node);
  }
}

export function deserializeUpdatesSnapshot(ctx: GameState, v: CursorView) {
  const network = getModule(ctx, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = network.networkIdToEntityId.get(nid) || NOOP;
    const node = eid ? getRemoteResource<RemoteNode>(ctx, eid) : undefined;

    deserializeTransformSnapshot(network, v, nid, node);

    if (node && node.skipLerp) {
      node.skipLerp = 10;
    }
  }
}

/* Updates - Changed */

export function serializeUpdatesChanged(ctx: GameState, v: CursorView) {
  const entities = ownedNetworkedQuery(ctx.world);
  const writeCount = spaceUint32(v);
  let count = 0;
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const rewind = rewindCursorView(v);
    const writeNid = spaceUint32(v);
    const written = serializeTransformChanged(v, node);
    if (written) {
      writeNid(nid);
      count += 1;
    } else {
      rewind();
    }
  }
  writeCount(count);
}

export function deserializeUpdatesChanged(ctx: GameState, v: CursorView) {
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

    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    deserializeTransformChanged(v, nid, node);
  }
}

/* Delete */

export function serializeDeletes(ctx: GameState, v: CursorView) {
  const entities = deletedOwnedNetworkedQuery(ctx.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    writeUint32(v, nid);
    console.info("serialized deletion for nid", nid, "eid", eid, "prefab", Prefab.get(eid));
  }
}

export function deserializeDeletes(ctx: GameState, v: CursorView) {
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
}

/* Update NetworkId Message */

export const serializeUpdateNetworkId = (ctx: GameState, v: CursorView, from: number, to: number) => {
  console.info("serializeUpdateNetworkId", from, "->", to);
  writeUint32(v, from);
  writeUint32(v, to);
};
export function deserializeUpdateNetworkId(ctx: GameState, v: CursorView) {
  const network = getModule(ctx, NetworkModule);

  const from = readUint32(v);
  const to = readUint32(v);

  const eid = network.networkIdToEntityId.get(from);
  if (!eid) throw new Error("could not find entity for nid: " + from);

  Networked.networkId[eid] = to;

  console.info("deserializeUpdateNetworkId", from, "->", to);
}
export function createUpdateNetworkIdMessage(ctx: GameState, from: number, to: number) {
  writeMetadata(messageView, NetworkAction.UpdateNetworkId);
  serializeUpdateNetworkId(ctx, messageView, from, to);
  return sliceCursorView(messageView);
}

/* Player NetworkId Message */

export const serializeInformPlayerNetworkId = (ctx: GameState, v: CursorView, peerId: string) => {
  console.info("serializeInformPlayerNetworkId", peerId);
  const network = getModule(ctx, NetworkModule);
  const peerEid = network.peerIdToEntityId.get(peerId);
  if (peerEid === undefined) {
    throw new Error(`could not send NetworkMessage.InformPlayerNetworkId, ${peerId} not set on peerIdToEntity map`);
  }

  const peerNid = Networked.networkId[peerEid];
  if (peerNid === NOOP) {
    throw new Error(`could not send NetworkMessage.InformPlayerNetworkId, ${peerEid} has no networkId assigned`);
  }

  writeString(v, peerId);
  writeUint32(v, peerNid);
};

export async function deserializeInformPlayerNetworkId(ctx: GameState, v: CursorView) {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);

  // read
  const peerId = readString(v);
  const peerNid = readUint32(v);

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
    addNametag(ctx, AVATAR_HEIGHT + AVATAR_HEIGHT / 3, peerNode, peerId);
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
}

export function createInformXRModeMessage(ctx: GameState, xrMode: XRMode) {
  writeMetadata(messageView, NetworkAction.InformXRMode);

  serializeInformXRMode(messageView, xrMode);

  return sliceCursorView(messageView);
}
export const serializeInformXRMode = (v: CursorView, xrMode: XRMode) => {
  writeUint8(v, xrMode);
};
export const deserializeInformXRMode = (ctx: GameState, v: CursorView, peerId: string) => {
  const network = getModule(ctx, NetworkModule);

  // read
  const xrMode = readUint8(v);

  console.info(`deserializeInformXRMode - peerId: ${peerId}; xrMode: ${xrMode}`);

  // effect
  network.peerIdToXRMode.set(peerId, xrMode);
};

export function createInformPlayerNetworkIdMessage(ctx: GameState, peerId: string) {
  writeMetadata(messageView, NetworkAction.InformPlayerNetworkId);
  serializeInformPlayerNetworkId(ctx, messageView, peerId);
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
    const avatarEid = AvatarRef.eid[node.eid];
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

export const createNewPeerSnapshotMessage = (ctx: GameState, v: CursorView) => {
  writeMetadata(v, NetworkAction.NewPeerSnapshot);
  serializeCreatesSnapshot(ctx, v);
  serializeUpdatesSnapshot(ctx, v);
  return sliceCursorView(v);
};

export const deserializeNewPeerSnapshot = (ctx: GameState, v: CursorView, peerId: string) => {
  deserializeCreates(ctx, v, peerId);
  deserializeUpdatesSnapshot(ctx, v);
};

// Full Snapshot Update
export const createFullSnapshotMessage = (ctx: GameState, v: CursorView) => {
  writeMetadata(v, NetworkAction.FullSnapshot);
  serializeCreates(ctx, v);
  serializeUpdatesSnapshot(ctx, v);
  serializeDeletes(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT * 3) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export const deserializeSnapshot = (ctx: GameState, v: CursorView, peerId: string) => {
  deserializeCreates(ctx, v, peerId);
  deserializeUpdatesSnapshot(ctx, v);
};

// Changed State Update
export const createFullChangedMessage = (ctx: GameState, v: CursorView) => {
  writeMetadata(v, NetworkAction.FullChanged);
  serializeCreates(ctx, v);
  serializeUpdatesChanged(ctx, v);
  serializeDeletes(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT * 3) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export const deserializeFullChangedUpdate = (ctx: GameState, v: CursorView, peerId: string) => {
  deserializeCreates(ctx, v, peerId);
  deserializeUpdatesChanged(ctx, v);
  deserializeDeletes(ctx, v);
};

// Deletion Update
export const createDeleteMessage = (ctx: GameState, v: CursorView) => {
  writeMetadata(v, NetworkAction.Delete);
  serializeDeletes(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export const createCreateMessage = (ctx: GameState, v: CursorView) => {
  writeMetadata(v, NetworkAction.Create);
  serializeCreates(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export const createUpdateChangedMessage = (ctx: GameState, v: CursorView) => {
  writeMetadata(v, NetworkAction.UpdateChanged);
  serializeUpdatesChanged(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export const createUpdateSnapshotMessage = (ctx: GameState, v: CursorView) => {
  writeMetadata(v, NetworkAction.UpdateSnapshot);
  serializeUpdatesSnapshot(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export function createClientPositionMessage(ctx: GameState, eid: number) {
  const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
  const camera = getCamera(ctx, node).parent!;

  writeMetadata(messageView, NetworkAction.ClientPosition);

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
export function deserializeClientPosition(ctx: GameState, v: CursorView) {
  const network = getModule(ctx, NetworkModule);

  const nid = readUint32(v);
  const player = network.networkIdToEntityId.get(nid)!;
  const node = tryGetRemoteResource<RemoteNode>(ctx, player);
  const camera = getCamera(ctx, node).parent!;

  const body = RigidBody.store.get(node.eid);

  _p.x = readFloat32(v);
  _p.y = readFloat32(v);
  _p.z = readFloat32(v);

  _q.x = readFloat32(v);
  _q.y = readFloat32(v);
  _q.z = readFloat32(v);
  _q.w = readFloat32(v);

  _v.x = readFloat32(v);
  _v.y = readFloat32(v);
  _v.z = readFloat32(v);

  camera.quaternion[0] = readFloat32(v);
  camera.quaternion[1] = readFloat32(v);
  camera.quaternion[2] = readFloat32(v);
  camera.quaternion[3] = readFloat32(v);

  body?.setTranslation(_p, true);
  body?.setLinvel(_v, true);
  body?.setRotation(_q, true);
}
