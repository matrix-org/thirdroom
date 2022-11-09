import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { createCommandMessage } from "./commands.game";
import { isHost } from "./network.common";
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
  createFullChangedMessage,
  createInformPlayerNetworkIdMessage,
  createUpdateNetworkIdMessage,
} from "./serialization.game";

export const broadcastReliable = (state: GameState, network: GameNetworkState, packet: ArrayBuffer) => {
  if (!enqueueNetworkRingBuffer(network.outgoingRingBuffer, "", packet, true)) {
    console.warn("outgoing network ring buffer full");
  }
};

export const broadcastUnreliable = (state: GameState, packet: ArrayBuffer) => {
  throw new Error("broadcastUnreliable not implemented");
};

export const sendReliable = (state: GameState, network: GameNetworkState, peerId: string, packet: ArrayBuffer) => {
  if (!enqueueNetworkRingBuffer(network.outgoingRingBuffer, peerId, packet)) {
    console.warn("outgoing network ring buffer full");
  }
};

export const sendUnreliable = (state: GameState, peerId: string, packet: ArrayBuffer) => {
  throw new Error("sendUnreliable not implemented");
};

const assignNetworkIds = (ctx: GameState) => {
  const network = getModule(ctx, NetworkModule);
  const entered = enteredNetworkIdQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const nid = createNetworkId(ctx) || 0;

    const hostReelected = Networked.networkId[eid] !== 0;
    if (network.authoritative && isHost(network) && hostReelected) {
      broadcastReliable(ctx, network, createUpdateNetworkIdMessage(ctx, Networked.networkId[eid], nid));
    }

    Networked.networkId[eid] = nid;
    console.info("networkId", nid, "assigned to eid", eid);
    network.networkIdToEntityId.set(nid, eid);
  }
  return ctx;
};

const deleteNetworkIds = (state: GameState) => {
  const exited = exitedNetworkIdQuery(state.world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    console.info("networkId", Networked.networkId[eid], "deleted from eid", eid);
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

const sendUpdatesAuthoritative = (ctx: GameState) => {
  const network = getModule(ctx, NetworkModule);
  const data: NetPipeData = [ctx, network.cursorView, ""];

  // only send updates when:
  // TODO: window is focused? otherwise ringbuffer overflowss
  // - we have connected peers
  // - player rig has spawned
  // - host has been established (peerIdIndex has been assigned)
  const haveConnectedPeers = network.peers.length > 0;
  const spawnedPlayerRig = ownedPlayerQuery(ctx.world).length > 0;
  const hostEstablished = network.hostId !== "" && network.peerIdToIndex.has(network.peerId);
  const hosting = isHost(network);

  if (!haveConnectedPeers || !spawnedPlayerRig || !hostEstablished) {
    return ctx;
  }

  // send snapshot update to all new peers
  const haveNewPeers = network.newPeers.length > 0;

  if (hosting) {
    if (haveNewPeers) {
      const newPeerSnapshotMsg = createNewPeerSnapshotMessage(data);

      while (network.newPeers.length) {
        const theirPeerId = network.newPeers.shift();
        if (theirPeerId) {
          // send out a snapshot first so entity references in the following messages exist
          sendReliable(ctx, network, theirPeerId, newPeerSnapshotMsg);

          // inform new peer of this host avatar's networkId
          sendReliable(ctx, network, theirPeerId, createInformPlayerNetworkIdMessage(ctx, network.peerId));

          // inform everyone of new peer
          broadcastReliable(ctx, network, createInformPlayerNetworkIdMessage(ctx, theirPeerId));
        }
      }
    } else {
      // send state updates if hosting
      const msg = createFullChangedMessage(data);
      if (msg.byteLength) broadcastReliable(ctx, network, msg);
    }
  } else if (network.commands.length) {
    if (haveNewPeers) network.newPeers = [];

    // send commands to host if not hosting
    const msg = createCommandMessage(ctx, network.commands);
    if (msg.byteLength) sendReliable(ctx, network, network.hostId, msg);
    network.commands.length = 0;
  }

  return ctx;
};

const sendUpdatesPeerToPeer = (ctx: GameState) => {
  const network = getModule(ctx, NetworkModule);
  const data: NetPipeData = [ctx, network.cursorView, ""];

  // only send updates when:
  // - we have connected peers
  // - peerIdIndex has been assigned
  // - player rig has spawned
  const haveConnectedPeers = network.peers.length > 0;
  const spawnedPlayerRig = ownedPlayerQuery(ctx.world).length > 0;

  if (haveConnectedPeers && spawnedPlayerRig) {
    // send snapshot update to all new peers
    const haveNewPeers = network.newPeers.length > 0;
    if (haveNewPeers) {
      const newPeerSnapshotMsg = createNewPeerSnapshotMessage(data);

      while (network.newPeers.length) {
        const theirPeerId = network.newPeers.shift();
        if (theirPeerId) {
          // send out the snapshot first so entities that the next messages may reference exist
          sendReliable(ctx, network, theirPeerId, newPeerSnapshotMsg);

          // inform new peer of our avatar's networkId
          sendReliable(ctx, network, theirPeerId, createInformPlayerNetworkIdMessage(ctx, network.peerId));
        }
      }
    } else {
      // reliably send full messages for now
      const msg = createFullChangedMessage(data);
      if (msg.byteLength) broadcastReliable(ctx, network, msg);
    }
  }

  return ctx;
};

export function OutboundNetworkSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  const hasPeerIdIndex = network.peerIdToIndex.has(network.peerId);
  if (!hasPeerIdIndex) return ctx;

  // assign networkIds before serializing game state
  assignNetworkIds(ctx);

  // serialize and send all outgoing updates
  try {
    if (network.authoritative) sendUpdatesAuthoritative(ctx);
    else sendUpdatesPeerToPeer(ctx);
  } catch (e) {
    console.error(e);
  }

  // delete networkIds after serializing game state (deletes serialization needs to know the nid before removal)
  deleteNetworkIds(ctx);

  disposeNetworkedEntities(ctx);

  return ctx;
}
