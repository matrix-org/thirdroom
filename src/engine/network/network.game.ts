import { defineQuery, enterQuery, exitQuery, Not, addComponent } from "bitecs";
import murmurHash from "murmurhash-js";
import { availableRead } from "@thirdroom/ringbuffer";

import { createCursorView, CursorView } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { ourPlayerQuery, Player } from "../component/Player";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  AddPeerIdMessage,
  InitializeNetworkStateMessage,
  NetworkMessageType,
  RemovePeerIdMessage,
  SetHostMessage,
  SetPeerIdMessage,
} from "./network.common";
import { deserializeRemoveOwnership } from "./ownership.game";
import { createHistorian, Historian } from "./Historian";
import {
  deserializeClientPosition,
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
  embodyAvatar,
  NetPipeData,
} from "./serialization.game";
import { NetworkAction } from "./NetworkAction";
import { registerInboundMessageHandler } from "./inbound.game";
import { dequeueNetworkRingBuffer, NetworkRingBuffer } from "./RingBuffer";
import { deserializeCommands } from "./commands.game";
import { InputModule } from "../input/input.game";
import { PhysicsModule } from "../physics/physics.game";
import { waitUntil } from "../utils/waitUntil";
import { ExitWorldMessage, ThirdRoomMessageType } from "../../plugins/thirdroom/thirdroom.common";
import { getRemoteResource, tryGetRemoteResource } from "../resource/resource.game";
import { RemoteNode, removeObjectFromWorld } from "../resource/RemoteResources";
import { Networked, Owned } from "./NetworkComponents";
import { XRMode } from "../renderer/renderer.common";

/*********
 * Types *
 ********/

export interface GameNetworkState {
  onExitWorldQueue: any[];
  incomingReliableRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  incomingUnreliableRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  outgoingReliableRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  outgoingUnreliableRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  commands: [number, number, ArrayBuffer][];
  hostId: string;
  peerId: string;
  peers: string[];
  newPeers: string[];
  peerIdCount: number;
  peerIdToIndex: Map<string, number>;
  peerIdToHistorian: Map<string, Historian>;
  peerIdToEntityId: Map<string, number>;
  peerIdToXRMode: Map<string, XRMode>;
  entityIdToPeerId: Map<number, string>;
  networkIdToEntityId: Map<number, number>;
  indexToPeerId: Map<number, string>;
  localIdCount: number;
  removedLocalIds: number[];
  messageHandlers: { [key: number]: (input: NetPipeData) => void };
  cursorView: CursorView;
  tickRate: number;
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
    const {
      incomingReliableRingBuffer,
      incomingUnreliableRingBuffer,
      outgoingReliableRingBuffer,
      outgoingUnreliableRingBuffer,
      authoritative,
    } = await waitForMessage<InitializeNetworkStateMessage>(Thread.Main, NetworkMessageType.InitializeNetworkState);

    if (authoritative) console.info("Authoritative networking activated");

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
      tickRate: 10,
      interpolate: false,
      clientSidePrediction: true,
      authoritative,
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
    registerInboundMessageHandler(network, NetworkAction.FullChanged, deserializeFullChangedUpdate);
    registerInboundMessageHandler(network, NetworkAction.UpdateNetworkId, deserializeUpdateNetworkId);
    registerInboundMessageHandler(network, NetworkAction.InformPlayerNetworkId, deserializeInformPlayerNetworkId);
    registerInboundMessageHandler(network, NetworkAction.NewPeerSnapshot, deserializeNewPeerSnapshot);
    registerInboundMessageHandler(network, NetworkAction.RemoveOwnershipMessage, deserializeRemoveOwnership);
    registerInboundMessageHandler(network, NetworkAction.Command, deserializeCommands);
    registerInboundMessageHandler(network, NetworkAction.ClientPosition, deserializeClientPosition);
    registerInboundMessageHandler(network, NetworkAction.InformXRMode, deserializeInformXRMode);

    const disposables = [
      registerMessageHandler(ctx, NetworkMessageType.SetHost, onSetHost),
      registerMessageHandler(ctx, NetworkMessageType.SetPeerId, onSetPeerId),
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

const onAddPeerId = (ctx: GameState, message: AddPeerIdMessage) => {
  console.info("onAddPeerId", message.peerId);
  const network = getModule(ctx, NetworkModule);
  const { peerId } = message;

  if (network.peers.includes(peerId) || network.peerId === peerId) return;

  network.peers.push(peerId);
  network.newPeers.push(peerId);

  network.peerIdToHistorian.set(peerId, createHistorian());

  mapPeerIdAndIndex(network, peerId);
};

const onRemovePeerId = (ctx: GameState, message: RemovePeerIdMessage) => {
  const network = getModule(ctx, NetworkModule);
  const { peerId } = message;

  const peerArrIndex = network.peers.indexOf(peerId);
  const peerIndex = network.peerIdToIndex.get(peerId);

  if (peerArrIndex > -1 && peerIndex) {
    const entities = networkedQuery(ctx.world);

    // if not authoritative, remove all of this peer's owned entities
    if (!network.authoritative) {
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
    }

    // remove this peer's avatar entity
    const eid = network.peerIdToEntityId.get(peerId);
    const node = eid ? getRemoteResource<RemoteNode>(ctx, eid) : undefined;

    if (eid && node) {
      network.entityIdToPeerId.delete(eid);
      removeObjectFromWorld(ctx, node);
    }

    network.peers.splice(peerArrIndex, 1);
  } else {
    console.warn(`cannot remove peerId ${peerId}, does not exist in peer list`);
  }
};

const onExitWorld = (ctx: GameState, message: ExitWorldMessage) => {
  const network = getModule(ctx, NetworkModule);
  network.onExitWorldQueue.push(message);
};

export function NetworkExitWorldQueueSystem(ctx: GameState) {
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
const onSetPeerId = (ctx: GameState, message: SetPeerIdMessage) => {
  const network = getModule(ctx, NetworkModule);
  const { peerId } = message;
  network.peerId = peerId;
  mapPeerIdAndIndex(network, peerId);
};

const onSetHost = async (ctx: GameState, message: SetHostMessage) => {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);

  const newHostId = message.hostId;
  const oldHostId = network.hostId;
  const ourPeerId = network.peerId;

  const newHostPeerIndex = network.peerIdToIndex.get(newHostId);

  if (network.authoritative && newHostPeerIndex) {
    const newHostElected = oldHostId !== newHostId;
    const amNewHost = ourPeerId !== oldHostId && ourPeerId === newHostId;

    // if we are new host, take authority over our avatar entity
    const eid = await waitUntil<number>(() => ourPlayerQuery(ctx.world)[0] || network.peerIdToEntityId.get(ourPeerId));
    if (amNewHost) {
      const rig = tryGetRemoteResource<RemoteNode>(ctx, eid);
      embodyAvatar(ctx, physics, input, rig);
    }

    // if host was re-elected, transfer ownership of old host's networked entities to new host
    if (newHostElected) {
      network.localIdCount = 1;
      network.removedLocalIds = [];

      const ents = remoteNetworkedQuery(ctx.world);
      // update peerIdIndex of the networkId to new host's peerId
      for (let i = 0; i < ents.length; i++) {
        const eid = ents[i];
        const nid = Networked.networkId[eid];

        const entityPeerIndex = getPeerIndexFromNetworkId(nid);
        const entityPeerId = network.indexToPeerId.get(entityPeerIndex);
        if (!entityPeerId) throw new Error("could not find peerId for eid " + eid);

        if (oldHostId !== entityPeerId) {
          continue;
        }

        if (amNewHost) {
          addComponent(ctx.world, Owned, eid);
        } else {
          // NOTE: if not new host, then the host sends networkId updates (outbound.game.ts#assignNetworkIds)
        }
      }
    }
  }

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

export const createNetworkId = (state: GameState) => {
  const network = getModule(state, NetworkModule);

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

export const removeNetworkId = (ctx: GameState, nid: number) => {
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

export const remotePlayerQuery = defineQuery([Player, Not(Owned)]);
export const enteredRemotePlayerQuery = enterQuery(remotePlayerQuery);
export const exitedRemotePlayerQuery = exitQuery(remotePlayerQuery);
