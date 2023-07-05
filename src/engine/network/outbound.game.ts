import { addComponent } from "bitecs";

import { ThirdRoomModule } from "../../plugins/thirdroom/thirdroom.game";
import { GameContext } from "../GameTypes";
import { getModule } from "../module/module.common";
import { isHost } from "./network.common";
import {
  NetworkModule,
  exitedNetworkedQuery,
  ownedPlayerQuery,
  GameNetworkState,
  newPeersQueue,
  getPeerIndex,
  tryGetPeerIndex,
} from "./network.game";
import { Networked, Relaying } from "./NetworkComponents";
import {
  serializeHostSnapshot,
  serializePeerEntered,
  serializeHostCommands,
  serializeEntityUpdates,
} from "./NetworkMessage";
import { enqueueNetworkRingBuffer } from "./NetworkRingBuffer";

export const broadcastReliable = (ctx: GameContext, network: GameNetworkState, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingReliableRingBuffer, "", packet, true)) {
    console.warn("outgoing reliable network ring buffer full");
  }
};

export const broadcastUnreliable = (ctx: GameContext, network: GameNetworkState, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingUnreliableRingBuffer, "", packet, true)) {
    console.warn("outgoing unreliable network ring buffer full");
  }
};

export const sendReliable = (ctx: GameContext, network: GameNetworkState, peerId: string, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingReliableRingBuffer, peerId, packet)) {
    console.warn("outgoing reliable network ring buffer full");
  }
};

export const sendUnreliable = (ctx: GameContext, network: GameNetworkState, peerId: string, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingUnreliableRingBuffer, peerId, packet)) {
    console.warn("outgoing unreliable network ring buffer full");
  }
};

const sendUpdatesHost = (ctx: GameContext, network: GameNetworkState) => {
  const haveNewPeers = newPeersQueue.length > 0;
  if (haveNewPeers) {
    const thirdroom = getModule(ctx, ThirdRoomModule);

    // create an avatar for each new player before serializing the host snapshot
    for (const peerId of newPeersQueue) {
      const avatar = thirdroom.replicators!.avatar.spawn(ctx);

      const peerIndex = Number(tryGetPeerIndex(network, peerId));
      Networked.authorIndex[avatar.eid] = peerIndex;

      addComponent(ctx.world, Relaying, avatar.eid);
      Relaying.for[avatar.eid] = peerIndex;
    }

    const hostSnapshot = serializeHostSnapshot(ctx, network);

    let peerId;
    while ((peerId = newPeersQueue.dequeue())) {
      const peerIndex = getPeerIndex(network, peerId);
      if (!peerIndex) {
        throw new Error("Peer index missing for peerId: " + peerId);
      }

      // send snapshot to new peer
      sendReliable(ctx, network, peerId, hostSnapshot);

      // inform all peers of the new peer's info
      broadcastReliable(ctx, network, serializePeerEntered(ctx, network, peerId, peerIndex));
    }
  }

  // send HostCommands message
  broadcastReliable(ctx, network, serializeHostCommands(ctx, network));

  // send EntityUpdates message
  broadcastUnreliable(ctx, network, serializeEntityUpdates(ctx, network));
};

const sendUpdatesClient = (ctx: GameContext, network: GameNetworkState) => {
  sendReliable(ctx, network, network.hostId, serializeEntityUpdates(ctx, network));
};

export function OutboundNetworkSystem(ctx: GameContext) {
  const network = getModule(ctx, NetworkModule);

  const hasPeerIdIndex = network.peerIdToIndex.has(network.peerId);
  if (!hasPeerIdIndex) return ctx;

  // serialize and send all outgoing updates
  try {
    // only send updates when:
    // - we have connected to the host (prob unecessary, we only send updates to the host or we are the host)
    // - HostSnapshot received, meaning player rig has spawned, we are given authority over it, and peerIndex assigned
    const connectedToHost = isHost(network) || (network.hostId && network.peers.includes(network.hostId));
    const hostSnapshotReceived = ownedPlayerQuery(ctx.world).length > 0 && getPeerIndex(network, network.peerId);
    const connectedToPeers = network.peers.length;

    if (connectedToHost && hostSnapshotReceived && connectedToPeers) {
      if (isHost(network)) {
        sendUpdatesHost(ctx, network);
      } else {
        sendUpdatesClient(ctx, network);
      }
    }
  } catch (e) {
    console.error(e);
  }

  // delete networkId to entityId mapping
  const exited = exitedNetworkedQuery(ctx.world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    network.networkIdToEntityId.delete(BigInt(Networked.networkId[eid]));
  }

  return ctx;
}
