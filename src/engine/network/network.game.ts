import { defineQuery, enterQuery, exitQuery, Not, defineComponent, Types } from "bitecs";
import murmur from "murmurhash-js";

import { createCursorView, CursorView } from "../allocator/CursorView";
import { removeRecursive } from "../component/transform";
import { GameState } from "../GameTypes";
import { Player } from "../component/Player";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  AddPeerIdMessage,
  InitializeNetworkStateMessage,
  isHost,
  NetworkMessage,
  NetworkMessageType,
  RemovePeerIdMessage,
  SetHostMessage,
  SetPeerIdMessage,
} from "./network.common";
import { deserializeRemoveOwnership } from "./ownership.game";
import { createHistorian, Historian } from "./Historian";
import {
  deserializeCreates,
  deserializeDeletes,
  deserializeFullUpdate,
  deserializeInformPlayerNetworkId,
  deserializeNewPeerSnapshot,
  deserializePeerIdIndex,
  deserializeSnapshot,
  deserializeUpdatesChanged,
  deserializeUpdatesSnapshot,
  NetPipeData,
} from "./serialization.game";
import { NetworkAction } from "./NetworkAction";
import { registerInboundMessageHandler } from "./inbound.game";
import { NetworkRingBuffer } from "./RingBuffer";
import { deserializeCommand } from "./commands.game";

/*********
 * Types *
 ********/

export interface GameNetworkState {
  incomingRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  outgoingRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  hosting: boolean;
  incomingPackets: ArrayBuffer[];
  incomingPeerIds: string[];
  commands: ArrayBuffer[];
  hostId: string;
  peerId: string;
  peers: string[];
  newPeers: string[];
  peerIdCount: number;
  peerIdToIndex: Map<string, number>;
  peerIdToHistorian: Map<string, Historian>;
  peerIdToEntityId: Map<string, number>;
  entityIdToPeerId: Map<number, string>;
  networkIdToEntityId: Map<number, number>;
  indexToPeerId: Map<number, string>;
  localIdCount: number;
  removedLocalIds: number[];
  messageHandlers: { [key: number]: (input: NetPipeData) => void };
  cursorView: CursorView;
  // feature flags
  interpolate: boolean;
  clientSidePrediction: boolean;
  authoritative: boolean;
}

/******************
 * Initialization *
 *****************/

export const NetworkModule = defineModule<GameState, GameNetworkState>({
  name: "network",
  create: async (ctx, { waitForMessage }): Promise<GameNetworkState> => {
    const { incomingRingBuffer, outgoingRingBuffer } = await waitForMessage<InitializeNetworkStateMessage>(
      Thread.Main,
      NetworkMessageType.InitializeNetworkState
    );
    return {
      incomingRingBuffer,
      outgoingRingBuffer,
      hosting: false,
      incomingPackets: [],
      incomingPeerIds: [],
      commands: [],
      hostId: "",
      peerId: "",
      peers: [],
      newPeers: [],
      peerIdToIndex: new Map(),
      peerIdToHistorian: new Map(),
      networkIdToEntityId: new Map(),
      peerIdToEntityId: new Map(),
      entityIdToPeerId: new Map(),
      indexToPeerId: new Map(),
      peerIdCount: 0,
      localIdCount: 0,
      removedLocalIds: [],
      messageHandlers: {},
      cursorView: createCursorView(),
      interpolate: false,
      clientSidePrediction: false,
      authoritative: true,
    };
  },
  init(ctx: GameState) {
    const network = getModule(ctx, NetworkModule);

    // TODO: make new API for this that allows user to use strings (internally mapped to an integer)
    registerInboundMessageHandler(network, NetworkAction.Create, deserializeCreates);
    registerInboundMessageHandler(network, NetworkAction.UpdateChanged, deserializeUpdatesChanged);
    registerInboundMessageHandler(network, NetworkAction.UpdateSnapshot, deserializeUpdatesSnapshot);
    registerInboundMessageHandler(network, NetworkAction.Delete, deserializeDeletes);
    registerInboundMessageHandler(network, NetworkAction.FullSnapshot, deserializeSnapshot);
    registerInboundMessageHandler(network, NetworkAction.FullChanged, deserializeFullUpdate);
    registerInboundMessageHandler(network, NetworkAction.AssignPeerIdIndex, deserializePeerIdIndex);
    registerInboundMessageHandler(network, NetworkAction.InformPlayerNetworkId, deserializeInformPlayerNetworkId);
    registerInboundMessageHandler(network, NetworkAction.NewPeerSnapshot, deserializeNewPeerSnapshot);
    registerInboundMessageHandler(network, NetworkAction.RemoveOwnershipMessage, deserializeRemoveOwnership);
    registerInboundMessageHandler(network, NetworkAction.Command, deserializeCommand);

    const disposables = [
      registerMessageHandler(ctx, NetworkMessageType.SetHost, onSetHost),
      registerMessageHandler(ctx, NetworkMessageType.SetPeerId, onSetPeerId),
      registerMessageHandler(ctx, NetworkMessageType.AddPeerId, onAddPeerId),
      registerMessageHandler(ctx, NetworkMessageType.RemovePeerId, onRemovePeerId),
      registerMessageHandler(ctx, NetworkMessageType.NetworkMessage, onInboundNetworkMessage),
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

const onInboundNetworkMessage = (ctx: GameState, message: NetworkMessage) => {
  const network = getModule(ctx, NetworkModule);
  const { peerId, packet } = message;
  network.incomingPeerIds.unshift(peerId);
  network.incomingPackets.unshift(packet);
};

const onAddPeerId = (ctx: GameState, message: AddPeerIdMessage) => {
  const network = getModule(ctx, NetworkModule);
  const { peerId } = message;

  if (network.peers.includes(peerId) || network.peerId === peerId) return;

  network.peers.push(peerId);
  network.newPeers.push(peerId);

  network.peerIdToHistorian.set(peerId, createHistorian());

  // Set our local peer id index
  if (isHost(network)) mapPeerIdAndIndex(network, peerId);
};

const onRemovePeerId = (ctx: GameState, message: RemovePeerIdMessage) => {
  const network = getModule(ctx, NetworkModule);
  const { peerId } = message;

  const peerArrIndex = network.peers.indexOf(peerId);
  const peerIndex = network.peerIdToIndex.get(peerId);

  if (peerArrIndex > -1) {
    const entities = networkedQuery(ctx.world);

    for (let i = entities.length - 1; i >= 0; i--) {
      const eid = entities[i];

      const networkId = Networked.networkId[eid];

      if (peerIndex === getPeerIdIndexFromNetworkId(networkId)) {
        removeRecursive(ctx.world, eid);
      }
    }

    const eid = network.peerIdToEntityId.get(peerId);
    if (eid) removeRecursive(ctx.world, eid);

    network.peers.splice(peerArrIndex, 1);
    network.peerIdToIndex.delete(peerId);
    const eid2 = network.peerIdToEntityId.get(peerId);
    if (eid2) network.entityIdToPeerId.delete(eid2);
    network.peerIdToEntityId.delete(peerId);

    const historian = network.peerIdToHistorian.get(peerId);
    if (historian) historian.entities.clear();
  } else {
    console.warn(`cannot remove peerId ${peerId}, does not exist in peer list`);
  }
};

// Set local peer id
const onSetPeerId = (ctx: GameState, message: SetPeerIdMessage) => {
  const network = getModule(ctx, NetworkModule);
  const { peerId } = message;
  network.peerId = peerId;
  if (isHost(network)) mapPeerIdAndIndex(network, peerId);
};

const onSetHost = (ctx: GameState, message: SetHostMessage) => {
  const network = getModule(ctx, NetworkModule);
  network.hostId = message.hostId;
};

/* Utils */

const mapPeerIdAndIndex = (network: GameNetworkState, peerId: string) => {
  // const peerIdIndex = network.peerIdCount++;
  const peerIdIndex = murmur(peerId);
  network.peerIdToIndex.set(peerId, peerIdIndex);
  network.indexToPeerId.set(peerIdIndex, peerId);
};

const isolateBits = (val: number, n: number, offset = 0) => val & (((1 << n) - 1) << offset);

export const getPeerIdIndexFromNetworkId = (nid: number) => isolateBits(nid, 16);
export const getLocalIdFromNetworkId = (nid: number) => isolateBits(nid >>> 16, 16);

export const createNetworkId = (state: GameState) => {
  const network = getModule(state, NetworkModule);
  const localId = network.removedLocalIds.shift() || network.localIdCount++;
  const peerIdIndex = network.peerIdToIndex.get(network.peerId);

  if (peerIdIndex === undefined) {
    // console.error("could not create networkId, peerId not set in peerIdToIndex map");
    throw new Error("could not create networkId, peerId not set in peerIdToIndex map");
  }

  // bitwise operations in JS are limited to 32 bit integers (https://developer.mozilla.org/en-US/docs/web/javascript/reference/operators#binary_bitwise_operators)
  // logical right shift by 0 to treat as an unsigned integer
  return ((localId << 16) | peerIdIndex) >>> 0;
};

export const deleteNetworkId = (ctx: GameState, nid: number) => {
  const network = getModule(ctx, NetworkModule);
  const localId = getLocalIdFromNetworkId(nid);
  network.removedLocalIds.push(localId);
};

export const associatePeerWithEntity = (network: GameNetworkState, peerId: string, eid: number) => {
  network.peerIdToEntityId.set(peerId, eid);
  network.entityIdToPeerId.set(eid, peerId);
};

/* Components */

export const Networked = defineComponent({
  // networkId contains both peerIdIndex (owner) and localNetworkId
  networkId: Types.ui32,
  position: [Types.f32, 3],
  quaternion: [Types.f32, 4],
  velocity: [Types.f32, 3],
});

export const Owned = defineComponent();

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

export const remotePlayerQuery = defineQuery([Player, Not(Owned)]);
export const enteredRemotePlayerQuery = enterQuery(remotePlayerQuery);
export const exitedRemotePlayerQuery = exitQuery(remotePlayerQuery);
