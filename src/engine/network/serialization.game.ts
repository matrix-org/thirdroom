import { addComponent } from "bitecs";

import {
  CursorView,
  moveCursorView,
  readArrayBuffer,
  readFloat32,
  readString,
  readUint16,
  readUint32,
  readUint64,
  readUint8,
  rewindCursorView,
  scrollCursorView,
  sliceCursorView,
  spaceUint16,
  spaceUint32,
  spaceUint64,
  writeArrayBuffer,
  writeFloat32,
  writePropIfChanged,
  writeScalarPropIfChanged,
  writeString,
  writeUint32,
  writeUint64,
  writeUint8,
} from "../allocator/CursorView";
import { NOOP } from "../config.common";
import { GameContext } from "../GameTypes";
import { getModule } from "../module/module.common";
import { Prefab, createPrefabEntity } from "../prefab/prefab.game";
import { checkBitflag } from "../utils/checkBitflag";
import {
  authoringNetworkedQuery,
  spawnedNetworkeQuery,
  GameNetworkState,
  despawnedNetworkQuery,
  associatePeerWithEntity,
  NetworkID,
  tryGetPeerIndex,
} from "./network.game";
import { Networked } from "./NetworkComponents";
import { NetworkModule } from "./network.game";
import { NetworkMessage } from "./NetworkMessage";
import { waitUntil } from "../utils/waitUntil";
import { getRemoteResource, tryGetRemoteResource } from "../resource/resource.game";
import {
  addObjectToWorld,
  RemoteAudioData,
  RemoteAudioEmitter,
  RemoteAudioSource,
  RemoteNode,
  removeObjectFromWorld,
} from "../resource/RemoteResources";
import { XRMode } from "../renderer/renderer.common";
import { getReplicator } from "./Replicator";
import { addPlayerFromPeer, AVATAR_HEIGHT } from "../player/PlayerRig";
import { Player } from "../player/Player";
import { addNametag } from "../player/nametags.game";
import { AudioEmitterType } from "../resource/schema";

const metadataTotalBytes =
  Uint8Array.BYTES_PER_ELEMENT + Float64Array.BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT;

export const writeMessageType = (v: CursorView, type: NetworkMessage) => writeUint8(v, type);
export const readMessageType = (v: CursorView) => readUint8(v);

/* Transform serialization */

export const writeTransform = (v: CursorView, node: RemoteNode) => {
  const position = node.position;
  writeFloat32(v, position[0]);
  writeFloat32(v, position[1]);
  writeFloat32(v, position[2]);

  const velocity = node.physicsBody!.velocity;
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

export const readTransform = (
  network: GameNetworkState,
  v: CursorView,
  nid: NetworkID,
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

  const velocity = node.physicsBody!.velocity;
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

export const deserializeTransformChanged = (v: CursorView, nid: NetworkID, node: RemoteNode | undefined) => {
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
  ctx: GameContext,
  network: GameNetworkState,
  nid: NetworkID,
  prefab: string
): RemoteNode {
  const node = createPrefabEntity(ctx, prefab);

  // assign networkId
  addComponent(ctx.world, Networked, node.eid, true);
  Networked.networkId[node.eid] = Number(nid);
  network.networkIdToEntityId.set(nid, node.eid);
  addObjectToWorld(ctx, node);

  return node;
}

function writeCreation(network: GameNetworkState, v: CursorView, eid: number) {
  const nid = BigInt(Networked.networkId[eid]);

  const prefabName = Prefab.get(eid);
  if (!prefabName) {
    // TODO: gracefully fail and rewind cursor view?
    throw new Error(`could not serialize creation for ${eid}, entity has no prefab`);
  }

  writeUint64(v, nid);
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

export function serializeCreatesSnapshot(ctx: GameContext, v: CursorView) {
  const network = getModule(ctx, NetworkModule);
  const entities = authoringNetworkedQuery(ctx.world);

  // TODO: optimize length written with maxEntities config
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    writeCreation(network, v, eid);
  }
}

export function serializeCreates(ctx: GameContext, v: CursorView) {
  const network = getModule(ctx, NetworkModule);
  const entities = spawnedNetworkeQuery(ctx.world);

  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    writeCreation(network, v, eid);
  }
}

export function deserializeCreates(ctx: GameContext, v: CursorView, peerId: string) {
  const network = getModule(ctx, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint64(v);
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
        peerIndex: tryGetPeerIndex(network, peerId),
        data,
      });
      network.deferredUpdates.set(nid, []);
    } else {
      createRemoteNetworkedEntity(ctx, network, nid, prefabName);
    }
  }
}

/* Updates - Snapshot */

export function serializeUpdatesSnapshot(ctx: GameContext, v: CursorView) {
  const entities = authoringNetworkedQuery(ctx.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = BigInt(Networked.networkId[eid]);
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    writeUint64(v, nid);
    writeTransform(v, node);
  }
}

export function deserializeUpdatesSnapshot(ctx: GameContext, v: CursorView) {
  const network = getModule(ctx, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint64(v);
    const eid = network.networkIdToEntityId.get(nid) || NOOP;
    const node = getRemoteResource<RemoteNode>(ctx, eid);

    readTransform(network, v, nid, node);
  }
}

/* Updates - Changed */

export function serializeUpdatesChanged(ctx: GameContext, v: CursorView) {
  const entities = authoringNetworkedQuery(ctx.world);
  const writeCount = spaceUint32(v);
  let count = 0;
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = BigInt(Networked.networkId[eid]);
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const rewind = rewindCursorView(v);
    const writeNid = spaceUint64(v);
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

export function deserializeUpdatesChanged(ctx: GameContext, v: CursorView) {
  const network = getModule(ctx, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint64(v);
    const eid = network.networkIdToEntityId.get(nid) || NOOP;

    if (eid === NOOP) {
      console.warn(`could not deserialize update for non-existent entity for networkId ${nid}`);
    }

    const node = getRemoteResource<RemoteNode>(ctx, eid);
    deserializeTransformChanged(v, nid, node);
  }
}

/* Delete */

export function serializeDeletes(ctx: GameContext, v: CursorView) {
  const entities = despawnedNetworkQuery(ctx.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = BigInt(Networked.networkId[eid]);
    writeUint64(v, nid);
    console.info("serialized deletion for nid", nid, "eid", eid, "prefab", Prefab.get(eid));
  }
}

export function deserializeDeletes(ctx: GameContext, v: CursorView) {
  const network = getModule(ctx, NetworkModule);
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint64(v);
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

export const serializeUpdateNetworkId = (ctx: GameContext, v: CursorView, from: NetworkID, to: NetworkID) => {
  console.info("serializeUpdateNetworkId", from, "->", to);
  writeUint64(v, from);
  writeUint64(v, to);
};
export function deserializeUpdateNetworkId(ctx: GameContext, v: CursorView) {
  const network = getModule(ctx, NetworkModule);

  const from = readUint64(v);
  const to = readUint64(v);

  const eid = network.networkIdToEntityId.get(from);
  if (!eid) throw new Error("could not find entity for nid: " + from);

  Networked.networkId[eid] = Number(to);

  console.info("deserializeUpdateNetworkId", from, "->", to);
}
export function createUpdateNetworkIdMessage(ctx: GameContext, from: number, to: number) {
  const network = getModule(ctx, NetworkModule);
  writeMessageType(network.cursorView, NetworkMessage.UpdateNetworkId);
  serializeUpdateNetworkId(ctx, network.cursorView, BigInt(from), BigInt(to));
  return sliceCursorView(network.cursorView);
}

/* Player NetworkId Message */

export const serializeInformPlayerNetworkId = (ctx: GameContext, v: CursorView, peerId: string) => {
  console.info("serializeInformPlayerNetworkId", peerId);
  const network = getModule(ctx, NetworkModule);
  const eid = network.peerIdToEntityId.get(peerId);
  if (eid === undefined) {
    throw new Error(`could not send NetworkMessage.InformPlayerNetworkId, ${peerId} not set on peerIdToEntity map`);
  }

  const nid = BigInt(Networked.networkId[eid]);
  if (!nid) {
    throw new Error(`could not send NetworkMessage.InformPlayerNetworkId, ${eid} has no networkId assigned`);
  }

  writeString(v, peerId);
  writeUint64(v, nid);
};

export async function deserializeInformPlayerNetworkId(ctx: GameContext, v: CursorView) {
  const network = getModule(ctx, NetworkModule);

  // read
  const peerId = readString(v);
  const peerNid = BigInt(readUint64(v));

  console.info("deserializeInformPlayerNetworkId for peer", peerId, peerNid);

  // BUG: entity creation message is parsed after this message for some reason
  // HACK: await the entity's creation
  const peid = await waitUntil<number>(() => network.networkIdToEntityId.get(peerNid));

  associatePeerWithEntity(network, peerId, peid);
  addPlayerFromPeer(ctx, peid, peerId);

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
}

export function createInformXRModeMessage(ctx: GameContext, xrMode: XRMode) {
  const network = getModule(ctx, NetworkModule);
  writeMessageType(network.cursorView, NetworkMessage.InformXRMode);
  serializeInformXRMode(network.cursorView, xrMode);
  return sliceCursorView(network.cursorView);
}
export const serializeInformXRMode = (v: CursorView, xrMode: XRMode) => {
  writeUint8(v, xrMode);
};
export const deserializeInformXRMode = (ctx: GameContext, v: CursorView, peerId: string) => {
  const network = getModule(ctx, NetworkModule);

  // read
  const xrMode = readUint8(v);

  console.info(`deserializeInformXRMode - peerId: ${peerId}; xrMode: ${xrMode}`);

  // effect
  network.peerIdToXRMode.set(peerId, xrMode);
};

export function createInformPlayerNetworkIdMessage(ctx: GameContext, peerId: string) {
  const network = getModule(ctx, NetworkModule);
  writeMessageType(network.cursorView, NetworkMessage.InformPlayerNetworkId);
  serializeInformPlayerNetworkId(ctx, network.cursorView, peerId);
  return sliceCursorView(network.cursorView);
}

/* Message Factories */

// New Peer Snapshot Update

export const createNewPeerSnapshotMessage = (ctx: GameContext, v: CursorView) => {
  writeMessageType(v, NetworkMessage.NewPeerSnapshot);
  serializeCreatesSnapshot(ctx, v);
  serializeUpdatesSnapshot(ctx, v);
  return sliceCursorView(v);
};

export const deserializeNewPeerSnapshot = (ctx: GameContext, v: CursorView, peerId: string) => {
  deserializeCreates(ctx, v, peerId);
  deserializeUpdatesSnapshot(ctx, v);
};

// Full Snapshot Update
export const createFullSnapshotMessage = (ctx: GameContext, v: CursorView) => {
  writeMessageType(v, NetworkMessage.FullSnapshot);
  serializeCreates(ctx, v);
  serializeUpdatesSnapshot(ctx, v);
  serializeDeletes(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT * 3) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export const deserializeSnapshot = (ctx: GameContext, v: CursorView, peerId: string) => {
  deserializeCreates(ctx, v, peerId);
  deserializeUpdatesSnapshot(ctx, v);
};

// Changed State Update
export const createFullChangedMessage = (ctx: GameContext, v: CursorView) => {
  writeMessageType(v, NetworkMessage.FullChanged);
  serializeCreates(ctx, v);
  serializeUpdatesChanged(ctx, v);
  serializeDeletes(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT * 3) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export const deserializeFullChangedUpdate = (ctx: GameContext, v: CursorView, peerId: string) => {
  deserializeCreates(ctx, v, peerId);
  deserializeUpdatesChanged(ctx, v);
  deserializeDeletes(ctx, v);
};

// Deletion Update
export const createDeleteMessage = (ctx: GameContext, v: CursorView) => {
  writeMessageType(v, NetworkMessage.Delete);
  serializeDeletes(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export const createCreateMessage = (ctx: GameContext, v: CursorView) => {
  writeMessageType(v, NetworkMessage.Create);
  serializeCreates(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export const createUpdateChangedMessage = (ctx: GameContext, v: CursorView) => {
  writeMessageType(v, NetworkMessage.UpdateChanged);
  serializeUpdatesChanged(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};

export const createUpdateSnapshotMessage = (ctx: GameContext, v: CursorView) => {
  writeMessageType(v, NetworkMessage.UpdateSnapshot);
  serializeUpdatesSnapshot(ctx, v);
  if (v.cursor <= metadataTotalBytes + Uint32Array.BYTES_PER_ELEMENT) {
    moveCursorView(v, 0);
  }
  return sliceCursorView(v);
};
