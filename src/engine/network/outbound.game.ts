import { createCursorView, moveCursorView, writeUint32 } from "../allocator/CursorView";
import { NOOP, tickRate } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { getXRMode } from "../renderer/renderer.game";
import { createCommandsMessage } from "./commands.game";
import { isHost } from "./network.common";
import {
  NetworkModule,
  enteredNetworkIdQuery,
  createNetworkId,
  exitedNetworkIdQuery,
  removeNetworkId,
  exitedNetworkedQuery,
  ownedPlayerQuery,
  GameNetworkState,
} from "./network.game";
import { Networked } from "./NetworkComponents";
import { enqueueNetworkRingBuffer } from "./RingBuffer";
import {
  NetPipeData,
  createNewPeerSnapshotMessage,
  createInformPlayerNetworkIdMessage,
  createUpdateNetworkIdMessage,
  createCreateMessage,
  createDeleteMessage,
  createUpdateChangedMessage,
  createInformXRMode,
} from "./serialization.game";

export const broadcastReliable = (state: GameState, network: GameNetworkState, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingReliableRingBuffer, "", packet, true)) {
    console.warn("outgoing reliable network ring buffer full");
  }
};

export const broadcastUnreliable = (state: GameState, network: GameNetworkState, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingUnreliableRingBuffer, "", packet, true)) {
    console.warn("outgoing unreliable network ring buffer full");
  }
};

export const sendReliable = (state: GameState, network: GameNetworkState, peerId: string, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingReliableRingBuffer, peerId, packet)) {
    console.warn("outgoing reliable network ring buffer full");
  }
};

export const sendUnreliable = (state: GameState, network: GameNetworkState, peerId: string, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingUnreliableRingBuffer, peerId, packet)) {
    console.warn("outgoing unreliable network ring buffer full");
  }
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

const unassignNetworkIds = (state: GameState) => {
  const exited = exitedNetworkIdQuery(state.world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    console.info("networkId", Networked.networkId[eid], "deleted from eid", eid);
    removeNetworkId(state, Networked.networkId[eid]);
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
    }

    // send reliable creates/deletes
    const createMsg = createCreateMessage(data);
    broadcastReliable(ctx, network, createMsg);

    // send reliable creates/deletes
    const deleteMsg = createDeleteMessage(data);
    broadcastReliable(ctx, network, deleteMsg);

    // send unreliable updates
    const updateMsg = createUpdateChangedMessage(data);
    if (updateMsg.byteLength) {
      network.peers.forEach((peerId) => {
        // HACK: host adds last input tick processed from this peer to each packet
        // TODO: should instead formalize a pipeline for serializing unique per-peer data
        const { latestTick } = network.peerIdToHistorian.get(peerId)!;

        const v = createCursorView(updateMsg);
        // move cursor to input tick area
        moveCursorView(v, Uint8Array.BYTES_PER_ELEMENT + Float64Array.BYTES_PER_ELEMENT);
        // write the input tick for this particular peer
        writeUint32(v, latestTick);

        sendReliable(ctx, network, peerId, updateMsg);
      });
    }
  } else if (network.commands.length) {
    if (haveNewPeers) network.newPeers = [];
    // send commands to host if not hosting
    const msg = createCommandsMessage(ctx, network.commands);
    if (msg.byteLength) {
      // HACK: add input tick from client side
      const v = createCursorView(msg);
      // move cursor to input tick area
      moveCursorView(v, Uint8Array.BYTES_PER_ELEMENT + Float64Array.BYTES_PER_ELEMENT);
      // write the input tick for this particular peer
      writeUint32(v, ctx.tick);

      sendReliable(ctx, network, network.hostId, msg);
    }
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

          // inform other clients of our XRMode
          broadcastReliable(ctx, network, createInformXRMode(ctx, getXRMode(ctx)));
        }
      }
    } else {
      // send reliable creates
      const createMsg = createCreateMessage(data);
      broadcastReliable(ctx, network, createMsg);

      // send reliable deletes
      const deleteMsg = createDeleteMessage(data);
      broadcastReliable(ctx, network, deleteMsg);

      // send unreliable updates
      const updateMsg = createUpdateChangedMessage(data);
      broadcastUnreliable(ctx, network, updateMsg);
    }
  }

  return ctx;
};

let then = performance.now();
let delta = 0;
export function OutboundNetworkSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  // throttle by network tickRate
  if (network.authoritative && isHost(network) && network.tickRate !== tickRate) {
    // if (network.tickRate !== tickRate) {
    const target = 1000 / network.tickRate;
    delta += performance.now() - then;
    then = performance.now();
    if (delta <= target) {
      return ctx;
    }
    delta = delta % target;
  }

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
  unassignNetworkIds(ctx);

  disposeNetworkedEntities(ctx);

  return ctx;
}
