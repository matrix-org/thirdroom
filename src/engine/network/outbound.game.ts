import { NOOP } from "../config.common";
import { GameContext } from "../GameTypes";
import { getModule } from "../module/module.common";
import { getXRMode } from "../renderer/renderer.game";
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
  createNewPeerSnapshotMessage,
  createInformPlayerNetworkIdMessage,
  createCreateMessage,
  createDeleteMessage,
  createUpdateChangedMessage,
  createInformXRModeMessage,
} from "./serialization.game";

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

const assignNetworkIds = (ctx: GameContext) => {
  const network = getModule(ctx, NetworkModule);
  const entered = enteredNetworkIdQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const nid = createNetworkId(ctx) || 0;

    Networked.networkId[eid] = nid;
    console.info("networkId", nid, "assigned to eid", eid);
    network.networkIdToEntityId.set(nid, eid);
  }
  return ctx;
};

const unassignNetworkIds = (ctx: GameContext) => {
  const exited = exitedNetworkIdQuery(ctx.world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    console.info("networkId", Networked.networkId[eid], "deleted from eid", eid);
    removeNetworkId(ctx, Networked.networkId[eid]);
    Networked.networkId[eid] = NOOP;
  }
  return ctx;
};

function disposeNetworkedEntities(ctx: GameContext) {
  const network = getModule(ctx, NetworkModule);
  const exited = exitedNetworkedQuery(ctx.world);

  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    network.networkIdToEntityId.delete(Networked.networkId[eid]);
  }
}

const sendUpdatesPeerToPeer = (ctx: GameContext) => {
  const network = getModule(ctx, NetworkModule);

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
      const newPeerSnapshotMsg = createNewPeerSnapshotMessage(ctx, network.cursorView);

      while (network.newPeers.length) {
        const theirPeerId = network.newPeers.shift();
        if (theirPeerId) {
          // send out the snapshot first so entities that the next messages may reference exist
          sendReliable(ctx, network, theirPeerId, newPeerSnapshotMsg);

          // inform new peer of our avatar's networkId
          sendReliable(ctx, network, theirPeerId, createInformPlayerNetworkIdMessage(ctx, network.peerId));

          // inform other clients of our XRMode
          broadcastReliable(ctx, network, createInformXRModeMessage(ctx, getXRMode(ctx)));
        }
      }
    } else {
      // send reliable creates
      const createMsg = createCreateMessage(ctx, network.cursorView);
      broadcastReliable(ctx, network, createMsg);

      // send reliable deletes
      const deleteMsg = createDeleteMessage(ctx, network.cursorView);
      broadcastReliable(ctx, network, deleteMsg);

      // send unreliable updates
      const updateMsg = createUpdateChangedMessage(ctx, network.cursorView);
      broadcastUnreliable(ctx, network, updateMsg);
    }
  }

  return ctx;
};

export function OutboundNetworkSystem(ctx: GameContext) {
  const network = getModule(ctx, NetworkModule);

  const hasPeerIdIndex = network.peerIdToIndex.has(network.peerId);
  if (!hasPeerIdIndex) return ctx;

  // assign networkIds before serializing game state
  assignNetworkIds(ctx);

  // serialize and send all outgoing updates
  try {
    sendUpdatesPeerToPeer(ctx);
  } catch (e) {
    console.error(e);
  }

  // delete networkIds after serializing game state (deletes serialization needs to know the nid before removal)
  unassignNetworkIds(ctx);

  disposeNetworkedEntities(ctx);

  return ctx;
}
