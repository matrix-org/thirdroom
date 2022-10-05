/* Send */

import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { NetworkMessageType } from "./network.common";
import {
  NetworkModule,
  enteredNetworkIdQuery,
  createNetworkId,
  Networked,
  exitedNetworkIdQuery,
  deleteNetworkId,
  exitedNetworkedQuery,
  ownedPlayerQuery,
  GameNetworkState,
} from "./network.game";
import { enqueueNetworkRingBuffer } from "./RingBuffer";
import {
  NetPipeData,
  createNewPeerSnapshotMessage,
  createPeerIdIndexMessage,
  createFullChangedMessage,
} from "./serialization.game";

export const broadcastReliable = (state: GameState, network: GameNetworkState, packet: ArrayBuffer) => {
  if (!enqueueNetworkRingBuffer(network.outgoingRingBuffer, "", packet, true)) {
    console.warn("outgoing network ring buffer full");
  }
};

export const broadcastUnreliable = (state: GameState, packet: ArrayBuffer) => {
  state.sendMessage(
    Thread.Main,
    {
      type: NetworkMessageType.NetworkBroadcast,
      packet,
      reliable: false,
    },
    [packet]
  );
};

export const sendReliable = (state: GameState, network: GameNetworkState, peerId: string, packet: ArrayBuffer) => {
  if (!enqueueNetworkRingBuffer(network.outgoingRingBuffer, peerId, packet)) {
    console.warn("outgoing network ring buffer full");
  }
};

export const sendUnreliable = (state: GameState, peerId: string, packet: ArrayBuffer) => {
  state.sendMessage(
    Thread.Main,
    {
      type: NetworkMessageType.NetworkMessage,
      peerId,
      packet,
      reliable: false,
    },
    [packet]
  );
};

const assignNetworkIds = (state: GameState) => {
  const network = getModule(state, NetworkModule);
  const entered = enteredNetworkIdQuery(state.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const nid = createNetworkId(state) || 0;
    Networked.networkId[eid] = nid;
    console.log("networkId", nid, "assigned to eid", eid);
    network.networkIdToEntityId.set(nid, eid);
  }
  return state;
};

const deleteNetworkIds = (state: GameState) => {
  const exited = exitedNetworkIdQuery(state.world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    deleteNetworkId(state, Networked.networkId[eid]);
    Networked.networkId[eid] = NOOP;
  }
  return state;
};

function disposeNetworkedEntities(state: GameState) {
  const network = getModule(state, NetworkModule);
  const exited = exitedNetworkedQuery(state.world);

  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    network.networkIdToEntityId.delete(Networked.networkId[eid]);
  }
}

const sendUpdates = (ctx: GameState) => {
  const network = getModule(ctx, NetworkModule);
  const data: NetPipeData = [ctx, network.cursorView];

  // only send updates when:
  // - we have connected peers
  // - player rig has spawned
  // - host has been established (peerIdIndex has been assigned)
  const haveConnectedPeers = network.peers.length > 0;
  const spawnedPlayerRig = ownedPlayerQuery(ctx.world).length > 0;
  const hostEstablished = network.hostId !== "";

  if (!haveConnectedPeers || !spawnedPlayerRig || !hostEstablished) {
    return ctx;
  }

  // send snapshot update to all new peers
  const haveNewPeers = network.newPeers.length > 0;
  if (haveNewPeers) {
    const newPeerSnapshotMsg = createNewPeerSnapshotMessage(data);

    while (network.newPeers.length) {
      const theirPeerId = network.newPeers.shift();
      if (theirPeerId) {
        // if hosting, broadcast peerIdIndex message
        // if (network.hosting) {
        // broadcastReliable(ctx, createPeerIdIndexMessage(ctx, theirPeerId));
        broadcastReliable(ctx, network, createPeerIdIndexMessage(ctx, network.peerId));
        // }

        sendReliable(ctx, network, theirPeerId, newPeerSnapshotMsg);
      }
    }
  } else {
    // if (network.hosting) {
    // reliably send full messages for now
    const msg = createFullChangedMessage(data);
    if (msg.byteLength) broadcastReliable(ctx, network, msg);
    // }
  }

  return ctx;
};

export function OutboundNetworkSystem(state: GameState) {
  const network = getModule(state, NetworkModule);

  const hasPeerIdIndex = network.peerIdToIndex.has(network.peerId);
  if (!hasPeerIdIndex) return state;

  // assign networkIds before serializing game state
  assignNetworkIds(state);
  // serialize and send all outgoing updates
  sendUpdates(state);
  // delete networkIds after serializing game state (deletes serialization needs to know the nid before removal)
  deleteNetworkIds(state);

  disposeNetworkedEntities(state);

  return state;
}
