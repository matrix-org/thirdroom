import { addComponent } from "bitecs";

import { GameContext } from "../GameTypes";
import {
  CursorView,
  writeUint64,
  writeString,
  readUint64,
  readString,
  writeFloat64,
  writeUint16,
  sliceCursorView,
  readFloat64,
  readUint16,
  readUint32,
  writeUint8,
  readUint8,
  readFloat32,
  scrollCursorView,
  spaceUint16,
  writeFloat32,
  writePropIfChanged,
  writeUint32,
  readArrayBuffer,
  writeArrayBuffer,
  spaceUint64,
  moveCursorView,
} from "../allocator/CursorView";
import { getModule } from "../module/module.common";
import { RemoteNode, removeObjectFromWorld } from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { checkBitflag } from "../utils/checkBitflag";
import { Networked } from "./NetworkComponents";
import { NetworkReplicator, tryGetNetworkReplicator } from "./NetworkReplicator";
import {
  PeerIndex,
  NetworkID,
  GameNetworkState,
  mapPeerIndex,
  tryGetPeerIndex,
  authoringNetworkedQuery,
  NetworkModule,
  unmapPeerIndex,
  spawnedNetworkeQuery,
  despawnedNetworkQuery,
  relayingNetworkedQuery,
} from "./network.game";

export enum NetworkMessage {
  // old
  Create,
  Delete,
  UpdateChanged,
  UpdateSnapshot,
  FullChanged,
  FullSnapshot,
  Prefab,
  InformPlayerNetworkId,
  NewPeerSnapshot,
  RemoveOwnershipMessage,
  UpdateNetworkId,
  BinaryScriptMessage,
  StringScriptMessage,
  InformXRMode,

  // new
  Spawn,
  Despawn,
  HostSnapshot,
  PeerEntered,
  PeerExited,
  HostCommands,
  PeerCommands,
  EntityUpdates,
}

export const UnreliableNetworkActions = [
  // old
  NetworkMessage.UpdateChanged,
  NetworkMessage.UpdateSnapshot,

  // new
  NetworkMessage.EntityUpdates,
];

export const writeMessageType = (v: CursorView, type: NetworkMessage) => writeUint8(v, type);
export const readMessageType = (v: CursorView) => readUint8(v);

/* Transform serialization */

export const writeTransform = (v: CursorView, node: RemoteNode) => {
  const cursorBefore = v.cursor;

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

  return v.cursor - cursorBefore;
};

export const readTransform = (v: CursorView, node: RemoteNode) => {
  const position = node.position;
  position[0] = readFloat32(v);
  position[1] = readFloat32(v);
  position[2] = readFloat32(v);

  const velocity = node.physicsBody!.velocity;
  velocity[0] = readFloat32(v);
  velocity[1] = readFloat32(v);
  velocity[2] = readFloat32(v);

  const quaternion = node.quaternion;
  quaternion[0] = readFloat32(v);
  quaternion[1] = readFloat32(v);
  quaternion[2] = readFloat32(v);
  quaternion[3] = readFloat32(v);
};

export const writeTransformMutations = (v: CursorView, node: RemoteNode) => {
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

  writeChangeMask(changeMask);

  return changeMask > 0;
};

export const readTransformMutations = (v: CursorView, nid: NetworkID, node: RemoteNode | undefined) => {
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
  } else {
    console.warn(`could not deserialize transform update for non-existent entity for networkID ${nid}`);
    scrollCursorView(v, Float32Array.BYTES_PER_ELEMENT * 10 + Uint32Array.BYTES_PER_ELEMENT);
  }
};

// PeerInfo
const writePeerInfo = (v: CursorView, peerId: string, peerIndex: PeerIndex) => {
  writeUint64(v, peerIndex);
  writeString(v, peerId);
};
const readPeerInfo = (network: GameNetworkState, v: CursorView) => {
  const peerIndex = readUint64(v);
  const peerId = readString(v);

  mapPeerIndex(network, peerId, peerIndex);
};

// Spawn
const writeSpawn = (
  v: CursorView,
  networkId: NetworkID,
  authorIndex: PeerIndex,
  replicator: NetworkReplicator<RemoteNode>,
  node: RemoteNode,
  data?: ArrayBuffer
) => {
  writeUint64(v, networkId);
  writeUint64(v, authorIndex);
  writeUint32(v, replicator.id);
  writeUint32(v, data?.byteLength || 0);
  if (data && data.byteLength > 0) writeArrayBuffer(v, data);
  replicator.snapshotCodec.encode(v, node);
};

const readSpawn = (ctx: GameContext, network: GameNetworkState, v: CursorView) => {
  // read
  const networkId = readUint64(v);
  const authorIndex = readUint64(v);
  const replicatorId = readUint32(v);
  const dataByteLength = readUint32(v);
  const data = dataByteLength > 0 ? readArrayBuffer(v, dataByteLength) : undefined;

  // effect
  const replicator = tryGetNetworkReplicator<RemoteNode>(network, replicatorId);
  const node = replicator.factory(ctx);

  // read
  replicator.snapshotCodec.decode(v, node);

  // HACK: have to remove object after decoding so that the view cursor is moved forward
  if (network.networkIdToEntityId.has(networkId)) {
    console.warn("Attempted to spawn an already exiting entity with networkId:", networkId);
    removeObjectFromWorld(ctx, node);
    return;
  }

  network.networkIdToEntityId.set(networkId, node.eid);

  // effect
  addComponent(ctx.world, Networked, node.eid);
  Networked.replicatorId[node.eid] = replicatorId;
  Networked.networkId[node.eid] = Number(networkId);
  Networked.authorIndex[node.eid] = Number(authorIndex);

  replicator.spawned.push({ node, data });

  // this keeps networkIdCount synchronized on all peers
  if (networkId > network.networkIdCount) {
    network.networkIdCount = networkId;
  }
};

// Despawn
const writeDespawn = (v: CursorView, nid: NetworkID) => {
  writeUint64(v, nid);
};
const readDespawn = (ctx: GameContext, network: GameNetworkState, v: CursorView) => {
  const nid = readUint64(v);
  const eid = network.networkIdToEntityId.get(nid)!;
  const node = tryGetRemoteResource<RemoteNode>(ctx, eid);

  const replicator = tryGetNetworkReplicator(network, Networked.replicatorId[eid]);
  replicator.despawn(node);
};

// Update
const writeUpdate = (
  v: CursorView,
  networkId: NetworkID,
  replicator: NetworkReplicator<RemoteNode>,
  node: RemoteNode
): boolean => {
  const writeNetworkId = spaceUint64(v);
  const bytesWritten = replicator.mutationCodec.encode(v, node);
  const written = bytesWritten > 0;
  if (written) {
    writeNetworkId(networkId);
  }
  return written;
};
const readUpdate = (ctx: GameContext, network: GameNetworkState, v: CursorView) => {
  // console.log("readUpdate =========");
  const networkId = readUint64(v);
  // console.log("networkId", networkId);

  const eid = network.networkIdToEntityId.get(networkId) || 0;
  const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
  const replicatorId = Networked.replicatorId[eid];
  const replicator = tryGetNetworkReplicator<RemoteNode>(network, replicatorId);

  replicator.mutationCodec.decode(v, node);
};

// Authority Transfer
// const writeAuthorityTransfer = (v: CursorView, nid: NetworkID, authorIndex: PeerIndex) => {
//   writeUint64(v, nid);
//   writeUint64(v, authorIndex);
// };
// const readAuthorityTransfer = (network: GameNetworkState, v: CursorView) => {
//   const nid = readUint64(v);
//   const authorIndex = readUint64(v);

//   const eid = network.networkIdToEntityId.get(nid);
//   if (!eid) {
//     console.warn("Unable to transfer authority, could not find entity for nid: " + nid);
//     return;
//   }

//   Networked.authorIndex[eid] = Number(authorIndex);
// };

// HostSnapshot Message
export const serializeHostSnapshot = (ctx: GameContext, network: GameNetworkState) => {
  const v = network.cursorView;

  writeMessageType(v, NetworkMessage.HostSnapshot);

  const time = performance.now();
  const peerIndex = tryGetPeerIndex(network, network.peerId);
  const hostIndex = tryGetPeerIndex(network, network.hostId);

  writeFloat64(v, time);
  writeUint64(v, peerIndex);
  writeUint64(v, hostIndex);

  const peerCount = network.peers.length;
  writeUint16(v, peerCount);
  for (let i = 0; i < peerCount; i++) {
    const peerId = network.peers[i];
    const peerIndex = tryGetPeerIndex(network, peerId);
    writePeerInfo(v, peerId, peerIndex);
  }

  // TODO: handle host migration cases
  const spawned = authoringNetworkedQuery(ctx.world);
  const spawnedRelaying = relayingNetworkedQuery(ctx.world);
  writeUint16(v, spawned.length + spawnedRelaying.length);
  for (let i = 0; i < spawned.length; i++) {
    const eid = spawned[i];
    const nid = BigInt(Networked.networkId[eid]);
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const replicator = tryGetNetworkReplicator(network, Networked.replicatorId[eid]);
    const authorIndex = BigInt(Networked.authorIndex[eid]);
    writeSpawn(v, nid, authorIndex, replicator, node);
  }
  // TODO: compress with above
  for (let i = 0; i < spawnedRelaying.length; i++) {
    const eid = spawnedRelaying[i];
    const nid = BigInt(Networked.networkId[eid]);
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const replicator = tryGetNetworkReplicator(network, Networked.replicatorId[eid]);
    const authorIndex = BigInt(Networked.authorIndex[eid]);
    writeSpawn(v, nid, authorIndex, replicator, node);
  }

  return sliceCursorView(v);
};

export const deserializeHostSnapshot = (ctx: GameContext, v: CursorView) => {
  const network = getModule(ctx, NetworkModule);

  readFloat64(v); // TOOD: handle time
  const localPeerIndex = readUint64(v);
  const hostPeerIndex = readUint64(v);

  mapPeerIndex(network, network.peerId, localPeerIndex);
  mapPeerIndex(network, network.hostId, hostPeerIndex);

  const peerCount = readUint16(v);
  for (let i = 0; i < peerCount; i++) {
    readPeerInfo(network, v);
  }

  const spawnCount = readUint16(v);
  for (let i = 0; i < spawnCount; i++) {
    readSpawn(ctx, network, v);
  }
};

// PeerEntered Message
export const serializePeerEntered = (
  ctx: GameContext,
  network: GameNetworkState,
  peerId: string,
  peerIndex: PeerIndex
) => {
  const v = network.cursorView;
  writeMessageType(v, NetworkMessage.PeerEntered);
  writePeerInfo(v, peerId, peerIndex);
  return sliceCursorView(v);
};
export const deserializePeerEntered = (ctx: GameContext, v: CursorView) => {
  const network = getModule(ctx, NetworkModule);
  readPeerInfo(network, v);
};

// PeerExited Message
export const serializePeerExited = (ctx: GameContext, network: GameNetworkState, peerIndex: PeerIndex) => {
  const v = network.cursorView;
  writeMessageType(v, NetworkMessage.PeerExited);
  writeUint64(v, peerIndex);
  return sliceCursorView(v);
};
export const deserializePeerExited = (ctx: GameContext, v: CursorView) => {
  const network = getModule(ctx, NetworkModule);
  const peerIndex = readUint64(v);
  const peerId = network.indexToPeerId.get(peerIndex)!;
  unmapPeerIndex(network, peerId);
};

// HostCommands Message
export const serializeHostCommands = (ctx: GameContext, network: GameNetworkState) => {
  const spawned = spawnedNetworkeQuery(ctx.world);
  const despawned = despawnedNetworkQuery(ctx.world);
  if (spawned.length === 0 && despawned.length === 0) {
    // TODO: return and handle undefined
    return new ArrayBuffer(0);
  }

  const v = network.cursorView;

  writeMessageType(v, NetworkMessage.HostCommands);

  writeUint16(v, spawned.length);
  for (let i = 0; i < spawned.length; i++) {
    const eid = spawned[i];
    const networkId = BigInt(Networked.networkId[eid]);
    const authorIndex = BigInt(Networked.authorIndex[eid]);
    const replicatorId = Networked.replicatorId[eid];

    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const replicator = tryGetNetworkReplicator<RemoteNode>(network, replicatorId);

    writeSpawn(v, networkId, authorIndex, replicator, node);
  }

  writeUint16(v, despawned.length);
  for (let i = 0; i < despawned.length; i++) {
    const eid = despawned[i];
    const nid = BigInt(Networked.networkId[eid]);
    writeDespawn(v, nid);
  }

  // TODO: implement transferAuthority(to) which simply adds a TransferAuthority component
  // const authorityTransfers = authorityTransferQuery(ctx.world);
  // writeUint32(v, authorityTransferQuery.length);
  // for (let i = 0; i < authorityTransferQuery.length; i++) {
  //   const authorityTransfer = authorityTransferQuery[i];
  //   writeAuthorityTransfer(v, authorityTransfer);
  // }

  return sliceCursorView(v);
};

export const deserializeHostCommands = (ctx: GameContext, v: CursorView) => {
  const network = getModule(ctx, NetworkModule);

  const spawnCount = readUint16(v);
  for (let i = 0; i < spawnCount; i++) {
    readSpawn(ctx, network, v);
  }

  const despawnCount = readUint16(v);
  for (let i = 0; i < despawnCount; i++) {
    readDespawn(ctx, network, v);
  }

  // const authorityTransferCount = readUint32(v);
  // for (let i = 0; i < authorityTransferCount; i++) {
  //   readAuthorityTransfer(network, v);
  // }
};

// EntityUpdates message
export const serializeEntityUpdates = (ctx: GameContext, network: GameNetworkState) => {
  const v = network.cursorView;
  writeMessageType(v, NetworkMessage.EntityUpdates);

  const time = performance.now();
  writeFloat64(v, time);

  const ents = authoringNetworkedQuery(ctx.world);
  let count = 0;
  const writeCount = spaceUint16(v);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const networkId = BigInt(Networked.networkId[eid]);
    const replicatorId = Networked.replicatorId[eid];
    const replicator = tryGetNetworkReplicator<RemoteNode>(network, replicatorId);
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);

    count += writeUpdate(v, networkId, replicator, node) ? 1 : 0;
  }

  if (count) {
    writeCount(count);
  } else {
    moveCursorView(v, 0);
  }

  return sliceCursorView(v);
};

export const deserializeEntityUpdates = (ctx: GameContext, v: CursorView, peerId: string) => {
  const network = getModule(ctx, NetworkModule);

  const time = readFloat64(v);

  const lastTime = network.peerIdToTime.get(peerId) || 0;
  network.peerIdToTime.set(peerId, time);
  if (time < lastTime) {
    return;
  }

  const count = readUint16(v);
  for (let i = 0; i < count; i++) {
    readUpdate(ctx, network, v);
  }
};
