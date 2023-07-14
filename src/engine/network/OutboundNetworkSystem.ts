import { GameContext } from "../GameTypes";
import { getModule } from "../module/module.common";
import { isHost } from "./network.common";
import {
  NetworkModule,
  exitedNetworkedQuery,
  ownedPlayerQuery,
  GameNetworkState,
  peerEnteredQueue,
} from "./network.game";
import { Networked } from "./NetworkComponents";
import {
  serializeHostSnapshot,
  serializeHostCommands,
  serializeEntityUpdates,
  serializePeerEntered,
} from "./NetworkMessage";
import { enqueueReliable, enqueueReliableBroadcast, enqueueUnreliableBroadcast } from "./NetworkRingBuffer";

const sendUpdatesHost = (ctx: GameContext, network: GameNetworkState) => {
  /**
   * Send updates from host if:
   * - we have connected peers
   */

  const connectedToPeers = network.peers.length > 1;
  if (!connectedToPeers) {
    return;
  }

  const haveNewPeers = peerEnteredQueue.length > 0;
  if (haveNewPeers) {
    // inform all existing peers about new peers, except for the new peers themselves
    console.log(
      "peerEnteredQueue",
      peerEnteredQueue.map((p) => JSON.parse(JSON.stringify(p)))
    );
    for (const peerInfo of network.peers) {
      console.log("peerInfo", peerInfo);
      console.log("peerEnteredQueue.includes(peerInfo)", peerEnteredQueue.includes(peerInfo));
      if (peerEnteredQueue.includes(peerInfo)) {
        continue;
      }
      console.log("broadcasting peer entered for", peerInfo);
      enqueueReliableBroadcast(network, serializePeerEntered(ctx, network, peerInfo.key, peerInfo.id!));
    }
    // send host snapshot to new peers
    let peerInfo;
    while ((peerInfo = peerEnteredQueue.dequeue())) {
      // TODO: optimize such that host snapshot isn't re-serialized for each peer
      console.log("sending host snapshot to ", peerInfo);
      enqueueReliable(network, peerInfo.key, serializeHostSnapshot(ctx, network, peerInfo));
    }
  }

  enqueueReliableBroadcast(network, serializeHostCommands(ctx, network));
  enqueueUnreliableBroadcast(network, serializeEntityUpdates(ctx, network));
};

const sendUpdatesClient = (ctx: GameContext, network: GameNetworkState) => {
  /**
   * Send updates from client if:
   * - we have peer connections
   * - we have a host connection
   * - host snapshot received
   */

  const connectedToPeers = network.peers.length > 0;
  if (!connectedToPeers) {
    return;
  }

  const connectedToHost = network.host && network.peers.includes(network.host);
  if (!connectedToHost) {
    return;
  }

  const hostSnapshotReceived = ownedPlayerQuery(ctx.world).length > 0 && network.local?.id;
  if (!hostSnapshotReceived) {
    return;
  }

  enqueueReliable(network, network.host!.key, serializeEntityUpdates(ctx, network));
};

export function OutboundNetworkSystem(ctx: GameContext) {
  const network = getModule(ctx, NetworkModule);

  try {
    if (isHost(network)) {
      sendUpdatesHost(ctx, network);
    } else {
      sendUpdatesClient(ctx, network);
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
