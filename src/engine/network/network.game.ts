import { defineQuery, enterQuery, exitQuery, Not } from "bitecs";
import murmurHash from "murmurhash-js";
import { availableRead } from "@thirdroom/ringbuffer";

import { createCursorView, CursorView } from "../allocator/CursorView";
import { GameContext } from "../GameTypes";
import { Player } from "../player/Player";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  AddPeerIdMessage,
  InitializeNetworkStateMessage,
  NetworkMessageType,
  PeerEnteredMessage,
  PeerExitedMessage,
  RemovePeerIdMessage,
  SetHostMessage,
} from "./network.common";
import { deserializeRemoveOwnership } from "./ownership.game";
import { createHistorian, Historian } from "./Historian";
import {
  deserializeCreates,
  deserializeDeletes,
  deserializeFullChangedUpdate,
  deserializeInformPlayerNetworkId,
  deserializeInformXRMode,
  deserializeNewPeerSnapshot,
  deserializeSnapshot,
  deserializeUpdateNetworkId,
  deserializeUpdatesChanged,
  deserializeUpdatesSnapshot,
} from "./serialization.game";
import { NetworkAction } from "./NetworkAction";
import { registerInboundMessageHandler } from "./inbound.game";
import { dequeueNetworkRingBuffer, NetworkRingBuffer } from "./RingBuffer";
import { ExitWorldMessage, ThirdRoomMessageType } from "../../plugins/thirdroom/thirdroom.common";
import { getRemoteResource } from "../resource/resource.game";
import { RemoteNode, removeObjectFromWorld } from "../resource/RemoteResources";
import { Networked, Owned } from "./NetworkComponents";
import { XRMode } from "../renderer/renderer.common";
import { Replicator } from "./Replicator";

/*********
 * Types *
 ********/

export interface DeferredUpdate {
  position: Float32Array;
  quaternion: Float32Array;
}

export interface GameNetworkState {
  onExitWorldQueue: any[];
  incomingReliableRingBuffer: NetworkRingBuffer;
  incomingUnreliableRingBuffer: NetworkRingBuffer;
  outgoingReliableRingBuffer: NetworkRingBuffer;
  outgoingUnreliableRingBuffer: NetworkRingBuffer;
  commands: [number, number, ArrayBuffer][];
  hostId: string;
  peerId: string;
  peers: string[];
  newPeers: string[];
  peerIdCount: number;
  peerIdToIndex: Map<string, number>;
  indexToPeerId: Map<number, string>;
  peerIdToHistorian: Map<string, Historian>;
  peerIdToEntityId: Map<string, number>;
  peerIdToXRMode: Map<string, XRMode>;
  entityIdToPeerId: Map<number, string>;
  networkIdToEntityId: Map<number, number>;
  localIdCount: number;
  removedLocalIds: number[];
  messageHandlers: {
    [key: number]: (ctx: GameContext, v: CursorView, peerId: string) => void;
  };
  cursorView: CursorView;
  tickRate: number;
  prefabToReplicator: Map<string, Replicator>;
  deferredUpdates: Map<number, DeferredUpdate[]>;
  // feature flags
  interpolate: boolean;
}

/******************
 * Initialization *
 *****************/

export const NetworkModule = defineModule<GameContext, GameNetworkState>({
  name: "network",
  create: async (ctx, { waitForMessage }): Promise<GameNetworkState> => {
    const {
      incomingReliableRingBuffer,
      incomingUnreliableRingBuffer,
      outgoingReliableRingBuffer,
      outgoingUnreliableRingBuffer,
    } = await waitForMessage<InitializeNetworkStateMessage>(Thread.Main, NetworkMessageType.InitializeNetworkState);

    return {
      onExitWorldQueue: [],
      incomingReliableRingBuffer,
      incomingUnreliableRingBuffer,
      outgoingReliableRingBuffer,
      outgoingUnreliableRingBuffer,
      commands: [],
      hostId: "",
      peerId: "",
      peers: [],
      newPeers: [],
      peerIdToIndex: new Map(),
      peerIdToHistorian: new Map(),
      networkIdToEntityId: new Map(),
      peerIdToEntityId: new Map(),
      peerIdToXRMode: new Map(),
      entityIdToPeerId: new Map(),
      indexToPeerId: new Map(),
      peerIdCount: 0,
      localIdCount: 1,
      removedLocalIds: [],
      messageHandlers: {},
      cursorView: createCursorView(),
      prefabToReplicator: new Map(),
      deferredUpdates: new Map(),
      tickRate: 10,
      interpolate: false,
    };
  },
  init(ctx: GameContext) {
    const network = getModule(ctx, NetworkModule);

    // TODO: make new API for this that allows user to use strings (internally mapped to an integer)
    registerInboundMessageHandler(network, NetworkAction.Create, deserializeCreates);
    registerInboundMessageHandler(network, NetworkAction.UpdateChanged, deserializeUpdatesChanged);
    registerInboundMessageHandler(network, NetworkAction.UpdateSnapshot, deserializeUpdatesSnapshot);
    registerInboundMessageHandler(network, NetworkAction.Delete, deserializeDeletes);
    registerInboundMessageHandler(network, NetworkAction.FullSnapshot, deserializeSnapshot);
    registerInboundMessageHandler(network, NetworkAction.FullChanged, deserializeFullChangedUpdate);
    registerInboundMessageHandler(network, NetworkAction.UpdateNetworkId, deserializeUpdateNetworkId);
    registerInboundMessageHandler(network, NetworkAction.InformPlayerNetworkId, deserializeInformPlayerNetworkId);
    registerInboundMessageHandler(network, NetworkAction.NewPeerSnapshot, deserializeNewPeerSnapshot);
    registerInboundMessageHandler(network, NetworkAction.RemoveOwnershipMessage, deserializeRemoveOwnership);
    registerInboundMessageHandler(network, NetworkAction.InformXRMode, deserializeInformXRMode);

    const disposables = [
      registerMessageHandler(ctx, NetworkMessageType.SetHost, onSetHost),
      registerMessageHandler(ctx, NetworkMessageType.AddPeerId, onAddPeerId),
      registerMessageHandler(ctx, NetworkMessageType.RemovePeerId, onRemovePeerId),
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, onExitWorld),
    ];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

/********************
 * Message Handlers *
 *******************/

export const addPeerId = (ctx: GameContext, peerId: string) => {
  console.info("addPeerId", peerId);
  const network = getModule(ctx, NetworkModule);

  if (network.peers.includes(peerId) || network.peerId === peerId) return;

  network.peers.push(peerId);
  network.newPeers.push(peerId);

  network.peerIdToHistorian.set(peerId, createHistorian());

  mapPeerIdAndIndex(network, peerId);

  const peerIndex = network.peerIdToIndex.get(peerId) || 0;

  ctx.sendMessage<PeerEnteredMessage>(Thread.Game, { type: NetworkMessageType.PeerEntered, peerIndex });
};

const onAddPeerId = (ctx: GameContext, message: AddPeerIdMessage) => addPeerId(ctx, message.peerId);

export const removePeerId = (ctx: GameContext, peerId: string) => {
  const network = getModule(ctx, NetworkModule);

  const peerArrIndex = network.peers.indexOf(peerId);
  const peerIndex = network.peerIdToIndex.get(peerId);

  if (peerArrIndex > -1 && peerIndex) {
    const entities = networkedQuery(ctx.world);

    for (let i = entities.length - 1; i >= 0; i--) {
      const eid = entities[i];
      const node = getRemoteResource<RemoteNode>(ctx, eid);

      const networkId = Networked.networkId[eid];

      // if the entity's networkId contains the peerIndex it means that peer owns the entity
      if (node && peerIndex === getPeerIndexFromNetworkId(networkId)) {
        network.entityIdToPeerId.delete(eid);
        removeObjectFromWorld(ctx, node);
      }
    }

    network.peers.splice(peerArrIndex, 1);

    ctx.sendMessage<PeerExitedMessage>(Thread.Game, { type: NetworkMessageType.PeerExited, peerIndex });
  } else {
    console.warn(`cannot remove peerId ${peerId}, does not exist in peer list`);
  }
};

const onRemovePeerId = (ctx: GameContext, message: RemovePeerIdMessage) => removePeerId(ctx, message.peerId);

const onExitWorld = (ctx: GameContext, message: ExitWorldMessage) => {
  const network = getModule(ctx, NetworkModule);
  network.onExitWorldQueue.push(message);
};

export function NetworkExitWorldQueueSystem(ctx: GameContext) {
  const network = getModule(ctx, NetworkModule);

  while (network.onExitWorldQueue.length) {
    network.onExitWorldQueue.shift();

    network.hostId = "";
    network.peers = [];
    network.newPeers = [];
    network.peerIdToEntityId.clear();
    network.entityIdToPeerId.clear();
    network.networkIdToEntityId.clear();
    network.localIdCount = 1;
    network.removedLocalIds = [];
    network.commands = [];
    // drain ring buffers
    const ringOut = { packet: new ArrayBuffer(0), peerId: "", broadcast: false };
    while (availableRead(network.outgoingReliableRingBuffer))
      dequeueNetworkRingBuffer(network.outgoingReliableRingBuffer, ringOut);
    while (availableRead(network.incomingReliableRingBuffer))
      dequeueNetworkRingBuffer(network.incomingReliableRingBuffer, ringOut);
  }
}

// Set local peer id
export const setLocalPeerId = (ctx: GameContext, localPeerId: string) => {
  const network = getModule(ctx, NetworkModule);
  network.peerId = localPeerId;
  mapPeerIdAndIndex(network, localPeerId);
};

const onSetHost = async (ctx: GameContext, message: SetHostMessage) => {
  const network = getModule(ctx, NetworkModule);
  const newHostId = message.hostId;
  network.hostId = newHostId;
};

/* Utils */

const mapPeerIdAndIndex = (network: GameNetworkState, peerId: string) => {
  const peerIndex = murmurHash(peerId) >>> 16;
  network.peerIdToIndex.set(peerId, peerIndex);
  network.indexToPeerId.set(peerIndex, peerId);
};

const isolateBits = (val: number, n: number, offset = 0) => val & (((1 << n) - 1) << offset);

export const getPeerIndexFromNetworkId = (nid: number) => isolateBits(nid, 16);
export const getLocalIdFromNetworkId = (nid: number) => isolateBits(nid >>> 16, 16);

export const setPeerIdIndexInNetworkId = (nid: number, peerIdIndex: number) => {
  const localId = getLocalIdFromNetworkId(nid);
  return ((localId << 16) | peerIdIndex) >>> 0;
};

export const createNetworkId = (ctx: GameContext) => {
  const network = getModule(ctx, NetworkModule);

  const localId = network.removedLocalIds.shift() || network.localIdCount++;
  const peerIndex = network.peerIdToIndex.get(network.peerId);

  if (peerIndex === undefined) {
    throw new Error("could not create networkId, peerId not set in peerIdToIndex map");
  }

  console.info("createNetworkId - localId:", localId, "; peerIndex:", peerIndex);

  // bitwise operations in JS are limited to 32 bit integers (https://developer.mozilla.org/en-US/docs/web/javascript/reference/operators#binary_bitwise_operators)
  // logical right shift by 0 to treat as an unsigned integer
  return ((localId << 16) | peerIndex) >>> 0;
};

export const removeNetworkId = (ctx: GameContext, nid: number) => {
  const network = getModule(ctx, NetworkModule);
  const localId = getLocalIdFromNetworkId(nid);
  if (network.removedLocalIds.includes(localId)) {
    console.warn(`could not remove localId ${localId}, already removed`);
  } else {
    network.removedLocalIds.push(localId);
  }
};

export const associatePeerWithEntity = (network: GameNetworkState, peerId: string, eid: number) => {
  network.peerIdToEntityId.set(peerId, eid);
  network.entityIdToPeerId.set(eid, peerId);
};

/* Queries */

export const networkedQuery = defineQuery([Networked]);
export const exitedNetworkedQuery = exitQuery(networkedQuery);

export const ownedNetworkedQuery = defineQuery([Networked, Owned]);
export const createdOwnedNetworkedQuery = enterQuery(ownedNetworkedQuery);
export const deletedOwnedNetworkedQuery = exitQuery(ownedNetworkedQuery);

export const remoteNetworkedQuery = defineQuery([Networked, Not(Owned)]);

// bitecs todo: add defineQueue to bitECS / allow multiple enter/exit queries to avoid duplicate query
export const networkIdQuery = defineQuery([Networked, Owned]);
export const enteredNetworkIdQuery = enterQuery(networkIdQuery);
export const exitedNetworkIdQuery = exitQuery(networkIdQuery);

export const ownedPlayerQuery = defineQuery([Player, Owned]);
export const enteredOwnedPlayerQuery = enterQuery(ownedPlayerQuery);
export const exitedOwnedPlayerQuery = exitQuery(ownedPlayerQuery);

// export const remotePlayerQuery = defineQuery([Player, Not(Owned)]);
// export const enteredRemotePlayerQuery = enterQuery(remotePlayerQuery);
// export const exitedRemotePlayerQuery = exitQuery(remotePlayerQuery);
