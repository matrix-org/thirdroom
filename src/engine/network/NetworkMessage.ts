import { addComponent, hasComponent } from "bitecs";

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
  spaceUint32,
} from "../allocator/CursorView";
import { getModule } from "../module/module.common";
import { RemoteNode, removeObjectFromWorld } from "../resource/RemoteResources";
import { getRemoteResource, tryGetRemoteResource } from "../resource/resource.game";
import { checkBitflag } from "../utils/checkBitflag";
import { Authoring, Networked } from "./NetworkComponents";
import { NetworkReplicator, tryGetNetworkReplicator } from "./NetworkReplicator";
import {
  GameNetworkState,
  authoringNetworkedQuery,
  NetworkModule,
  spawnedNetworkeQuery,
  despawnedNetworkQuery,
  relayingNetworkedQuery,
  removePeerInfo,
  NetworkID,
  PeerID,
  addPeerInfo,
  getPeerInfoByKey,
  PeerInfo,
} from "./network.game";
import { Codec } from "./Codec";

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

export const transformCodec: Codec<RemoteNode> = {
  encode: writeTransform,
  decode: readTransform,
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
export const writePeerInfo = (v: CursorView, peerKey: string, peerId: PeerID) => {
  console.log("writePeerInfo ========");
  console.log("peerId", peerId);
  console.log("peerKey", peerKey);
  writeUint64(v, peerId);
  writeString(v, peerKey);
};
export const readPeerInfo = (network: GameNetworkState, v: CursorView, hostPeerId?: PeerID, localPeerId?: PeerID) => {
  const peerId = readUint64(v);
  const peerKey = readString(v);

  console.log("readPeerInfo =========");
  console.log("hostPeerId", hostPeerId);
  console.log("localPeerId", localPeerId);
  console.log("peerId", peerId);
  console.log("peerKey", peerKey);

  const peerInfo = addPeerInfo(network, peerKey, peerId);

  if (peerId === hostPeerId) {
    console.log("setting host peer", peerInfo);
    network.host = peerInfo;
  }
  if (peerId === localPeerId) {
    console.log("setting local peer", peerInfo);
    network.local = peerInfo;
  }

  if (peerId > network.peerIdCount) {
    // this keeps peerIdCount synchronized on all peers
    // set count to one increment ahead of this peerId
    network.peerIdCount = peerId + 1n;
  }

  return peerInfo;
};

// Spawn
export const writeSpawn = (
  v: CursorView,
  networkId: NetworkID,
  authorId: PeerID,
  replicator: NetworkReplicator<RemoteNode>,
  node: RemoteNode,
  data?: ArrayBuffer
) => {
  writeUint64(v, networkId);
  writeUint64(v, authorId);
  writeUint32(v, replicator.id);
  writeUint32(v, data?.byteLength || 0);
  if (data && data.byteLength > 0) writeArrayBuffer(v, data);
  replicator.snapshotCodec.encode(v, node);
};

export const readSpawn = (ctx: GameContext, network: GameNetworkState, v: CursorView) => {
  // read
  const networkId = readUint64(v);
  const authorId = readUint64(v);
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
  Networked.authorId[node.eid] = Number(authorId);

  replicator.spawned.push({ node, data });

  // this keeps networkIdCount synchronized on all peers
  if (networkId > network.networkIdCount) {
    network.networkIdCount = networkId + 1n;
  }
};

// Despawn
export const writeDespawn = (v: CursorView, nid: NetworkID) => {
  writeUint64(v, nid);
};
export const readDespawn = (ctx: GameContext, network: GameNetworkState, v: CursorView) => {
  const nid = readUint64(v);
  const eid = network.networkIdToEntityId.get(nid)!;
  const node = tryGetRemoteResource<RemoteNode>(ctx, eid);

  const replicator = tryGetNetworkReplicator(network, Networked.replicatorId[eid]);
  replicator.despawned.enqueue(node);
};

// Update
export const writeUpdate = (
  v: CursorView,
  networkId: NetworkID,
  replicator: NetworkReplicator<RemoteNode>,
  node: RemoteNode
) => {
  const writeNetworkId = spaceUint64(v);
  const writeBytes = spaceUint32(v);
  const bytesWritten = replicator.mutationCodec.encode(v, node);
  if (bytesWritten) {
    writeNetworkId(networkId);
    writeBytes(bytesWritten);
  }
  return bytesWritten > 0;
};

export const readUpdate = (ctx: GameContext, network: GameNetworkState, v: CursorView) => {
  const networkId = readUint64(v);
  const bytesWritten = readUint32(v);

  const eid = network.networkIdToEntityId.get(networkId) || 0;
  const node = getRemoteResource<RemoteNode>(ctx, eid);
  const replicatorId = Networked.replicatorId[eid];
  const replicator = tryGetNetworkReplicator<RemoteNode>(network, replicatorId);

  // ignore update if node doesn't exist, or we are the author of this entity
  if (!node || hasComponent(ctx.world, Authoring, eid)) {
    scrollCursorView(v, bytesWritten);
    return;
  }

  replicator.mutationCodec.decode(v, node);
};

// Authority Transfer
// const writeAuthorityTransfer = (v: CursorView, nid: NetworkID, authorId: PeerIndex) => {
//   writeUint64(v, nid);
//   writeUint64(v, authorId);
// };
// const readAuthorityTransfer = (network: GameNetworkState, v: CursorView) => {
//   const nid = readUint64(v);
//   const authorId = readUint64(v);

//   const eid = network.networkIdToEntityId.get(nid);
//   if (!eid) {
//     console.warn("Unable to transfer authority, could not find entity for nid: " + nid);
//     return;
//   }

//   Networked.authorId[eid] = Number(authorId);
// };

// HostSnapshot Message
export const serializeHostSnapshot = (ctx: GameContext, network: GameNetworkState, peer: PeerInfo) => {
  const v = network.cursorView;

  writeMessageType(v, NetworkMessage.HostSnapshot);

  const time = performance.now();
  const { host } = network;

  writeFloat64(v, time);
  writeUint64(v, peer!.id!);
  writeUint64(v, host!.id!);

  const peerCount = network.peers.length;
  writeUint16(v, peerCount);
  for (let i = 0; i < peerCount; i++) {
    const peerInfo = network.peers[i];
    writePeerInfo(v, peerInfo.key, peerInfo.id!);
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
    const authorId = BigInt(Networked.authorId[eid]);
    writeSpawn(v, nid, authorId, replicator, node);
  }
  // TODO: compress with above
  for (let i = 0; i < spawnedRelaying.length; i++) {
    const eid = spawnedRelaying[i];
    const nid = BigInt(Networked.networkId[eid]);
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const replicator = tryGetNetworkReplicator(network, Networked.replicatorId[eid]);
    const authorId = BigInt(Networked.authorId[eid]);
    writeSpawn(v, nid, authorId, replicator, node);
  }

  return sliceCursorView(v);
};

export const deserializeHostSnapshot = (ctx: GameContext, v: CursorView) => {
  const network = getModule(ctx, NetworkModule);

  readFloat64(v); // TOOD: handle time
  const localPeerId = readUint64(v);
  const hostPeerId = readUint64(v);

  const peerCount = readUint16(v);
  for (let i = 0; i < peerCount; i++) {
    readPeerInfo(network, v, hostPeerId, localPeerId);
  }

  const spawnCount = readUint16(v);
  for (let i = 0; i < spawnCount; i++) {
    readSpawn(ctx, network, v);
  }
};

// PeerEntered Message
export const serializePeerEntered = (ctx: GameContext, network: GameNetworkState, peerKey: string, peerId: PeerID) => {
  const v = network.cursorView;
  writeMessageType(v, NetworkMessage.PeerEntered);
  writePeerInfo(v, peerKey, peerId);
  return sliceCursorView(v);
};
export const deserializePeerEntered = (ctx: GameContext, v: CursorView) => {
  const network = getModule(ctx, NetworkModule);
  readPeerInfo(network, v, network.host?.id, network.local?.id);
};

// PeerExited Message
export const serializePeerExited = (ctx: GameContext, network: GameNetworkState, peerIndex: PeerID) => {
  const v = network.cursorView;
  writeMessageType(v, NetworkMessage.PeerExited);
  writeUint64(v, peerIndex);
  return sliceCursorView(v);
};
export const deserializePeerExited = (ctx: GameContext, v: CursorView) => {
  const network = getModule(ctx, NetworkModule);
  const peerId = readUint64(v);
  const peerInfo = network.peerIdToInfo.get(peerId)!;
  removePeerInfo(network, peerInfo.key);
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
    const authorId = BigInt(Networked.authorId[eid]);
    const replicatorId = Networked.replicatorId[eid];

    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const replicator = tryGetNetworkReplicator<RemoteNode>(network, replicatorId);

    writeSpawn(v, networkId, authorId, replicator, node);
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

  const authors = authoringNetworkedQuery(ctx.world);
  let count = 0;
  const writeCount = spaceUint16(v);
  for (let i = 0; i < authors.length; i++) {
    const eid = authors[i];
    const networkId = BigInt(Networked.networkId[eid]);
    const replicatorId = Networked.replicatorId[eid];
    const replicator = tryGetNetworkReplicator<RemoteNode>(network, replicatorId);
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);

    count += writeUpdate(v, networkId, replicator, node) ? 1 : 0;
  }
  const relays = relayingNetworkedQuery(ctx.world);
  for (let i = 0; i < relays.length; i++) {
    const eid = relays[i];
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

export const deserializeEntityUpdates = (ctx: GameContext, v: CursorView, peerKey: string) => {
  const network = getModule(ctx, NetworkModule);

  const time = readFloat64(v);

  const peerInfo = getPeerInfoByKey(network, peerKey);
  if (!peerInfo) {
    return;
  }

  const lastTime = peerInfo.lastUpdate || 0;
  peerInfo.lastUpdate = time;
  if (time < lastTime) {
    return;
  }

  const count = readUint16(v);
  for (let i = 0; i < count; i++) {
    readUpdate(ctx, network, v);
  }
};
