import { CursorView, readArrayBuffer, readUint32, skipBytes } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { NetworkPacketType } from "./network.common";
import { NetworkModule } from "./network.game";
import { Networked } from "./NetworkComponents";
import { dequeueNetworkRingBuffer } from "./NetworkRingBuffer";

export function InboundNetworkSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  const cursorView = network.incomingRingBuffer.cursorView;

  while (dequeueNetworkRingBuffer(network.incomingRingBuffer)) {
    processNetworkPacket(ctx, cursorView);
  }
}

function processNetworkPacket(ctx: GameState, cursorView: CursorView) {
  const from = readUint32(cursorView);
  const type = readUint32(cursorView) as NetworkPacketType;

  switch (type) {
    case NetworkPacketType.Message:
      processMessagePacket(ctx, from, cursorView);
      break;
    case NetworkPacketType.Spawn:
      processSpawnPacket(ctx, from, cursorView);
      break;
    case NetworkPacketType.Despawn:
      processDespawnPacket(ctx, from, cursorView);
      break;
    case NetworkPacketType.Sync:
      processSyncPacket(ctx, from, cursorView);
      break;
    default:
      console.warn(`Unknown network packet type ${type} from ${from}`);
      break;
  }
}

function processMessagePacket(ctx: GameState, from: number, cursorView: CursorView) {
  const network = getModule(ctx, NetworkModule);
  const type = readUint32(cursorView);

  const messageHandler = network.messageHandlers.get(type);

  if (!messageHandler) {
    console.warn(`No handler registered for network message type ${type}`);
    return;
  }

  messageHandler(ctx, from, cursorView);
}

function processSpawnPacket(ctx: GameState, from: number, cursorView: CursorView) {
  const network = getModule(ctx, NetworkModule);

  const replicatorId = readUint32(cursorView);
  const networkId = readUint32(cursorView);
  const dataByteLength = readUint32(cursorView);
  const data = dataByteLength > 0 ? readArrayBuffer(cursorView, dataByteLength) : undefined;

  const replicator = network.replicators.get(replicatorId);

  if (!replicator) {
    console.warn(`Could not find replicator for replicatorId ${replicatorId}`);
    return;
  }

  if (from !== replicator.ownerId) {
    console.warn(`Ignoring spawn packet from non-owner from: ${from} owner: ${replicator.ownerId}`);
    return;
  }

  replicator.spawned.push({ networkId, data });
}

function processDespawnPacket(ctx: GameState, from: number, cursorView: CursorView) {
  const network = getModule(ctx, NetworkModule);

  const replicatorId = readUint32(cursorView);
  const replicator = network.replicators.get(replicatorId);

  if (!replicator) {
    console.warn(`Could not find replicator for replicatorId ${replicatorId}`);
    return;
  }

  if (from !== replicator.ownerId) {
    console.warn(`Ignoring despawn packet from non-owner from: ${from} owner: ${replicator.ownerId}`);
    return;
  }

  const networkId = readUint32(cursorView);
  const eid = network.networkIdToEntityId.get(networkId);

  if (eid === undefined) {
    console.warn(`Could not find entity with networkId ${networkId}`);
    return;
  }

  if (Networked.ownerId[eid] !== from) {
    console.warn(
      `Ignoring despawn packet for entity ${eid} from non-owner from: ${from} owner: ${Networked.ownerId[eid]}`
    );
    return;
  }

  replicator.despawned.push(eid);
}

function processSyncPacket(ctx: GameState, from: number, cursorView: CursorView) {
  const network = getModule(ctx, NetworkModule);

  const time = readUint32(cursorView); // When the sync message was sent
  const packetDataByteLength = readUint32(cursorView);
  const maxDataOffset = cursorView.cursor + packetDataByteLength;

  // Sync packet data contains a list of networkIds and their sync data
  while (cursorView.cursor < cursorView.byteLength && cursorView.cursor < maxDataOffset) {
    const networkId = readUint32(cursorView);
    const syncDataByteLength = readUint32(cursorView);

    const eid = network.networkIdToEntityId.get(networkId) as number;
    const synchronizerId = Networked.synchronizerId[eid];

    if (!synchronizerId) {
      // Entity hasn't been spawned yet, skip over the data
      skipBytes(cursorView, syncDataByteLength);
      continue;
    }

    if (time <= Networked.lastSyncTime[eid]) {
      // This sync message is older than the last sync message we've received for this entity,
      // skip over the data
      skipBytes(cursorView, syncDataByteLength);
      continue;
    }

    const ownerId = Networked.ownerId[eid];

    if (from !== Networked.ownerId[eid]) {
      console.warn(`Ignoring sync packet from non-owner from: ${from} owner: ${ownerId}`);
      return;
    }

    const synchronizer = network.synchronizers.get(synchronizerId);

    if (!synchronizer) {
      // Synchronizer hasn't been registered yet, skip over the data
      skipBytes(cursorView, syncDataByteLength);
      continue;
    }

    // Update the last sync time for this entity
    Networked.lastSyncTime[eid] = time;

    // Decode and apply the sync data
    synchronizer.decode(eid, cursorView);
  }
}
