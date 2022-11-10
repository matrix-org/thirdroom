import { defineQuery, enterQuery, exitQuery, Not, defineComponent, Types, addComponent } from "bitecs";
import murmurHash from "murmurhash-js";
import { availableRead } from "@thirdroom/ringbuffer";

import { createCursorView, CursorView } from "../allocator/CursorView";
import { removeRecursive } from "../component/transform";
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
  deserializeCreates,
  deserializeDeletes,
  deserializeFullUpdate,
  deserializeInformPlayerNetworkId,
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
import { deserializeCommand } from "./commands.game";
import { InputModule } from "../input/input.game";
import { PhysicsModule } from "../physics/physics.game";
import { waitUntil } from "../utils/waitUntil";
import { ExitWorldMessage, ThirdRoomMessageType } from "../../plugins/thirdroom/thirdroom.common";

/*********
 * Types *
 ********/

export interface GameNetworkState {
  incomingRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  outgoingRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
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
    const { incomingRingBuffer, outgoingRingBuffer, authoritative } =
      await waitForMessage<InitializeNetworkStateMessage>(Thread.Main, NetworkMessageType.InitializeNetworkState);

    if (authoritative) console.info("Authoritative networking activated");

    return {
      incomingRingBuffer,
      outgoingRingBuffer,
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
      // TODO: this causes desync atm
      clientSidePrediction: false,
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
    registerInboundMessageHandler(network, NetworkAction.FullChanged, deserializeFullUpdate);
    registerInboundMessageHandler(network, NetworkAction.UpdateNetworkId, deserializeUpdateNetworkId);
    registerInboundMessageHandler(network, NetworkAction.InformPlayerNetworkId, deserializeInformPlayerNetworkId);
    registerInboundMessageHandler(network, NetworkAction.NewPeerSnapshot, deserializeNewPeerSnapshot);
    registerInboundMessageHandler(network, NetworkAction.RemoveOwnershipMessage, deserializeRemoveOwnership);
    registerInboundMessageHandler(network, NetworkAction.Command, deserializeCommand);

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

        const networkId = Networked.networkId[eid];

        // if the entity's networkId contains the peerIndex it means that peer owns the entity
        if (peerIndex === getPeerIndexFromNetworkId(networkId)) {
          network.entityIdToPeerId.delete(eid);
          removeRecursive(ctx.world, eid);
        }
      }
    }

    // remove this peer's avatar entity
    const eid = network.peerIdToEntityId.get(peerId);
    if (eid) {
      network.entityIdToPeerId.delete(eid);
      removeRecursive(ctx.world, eid);
    }

    network.peers.splice(peerArrIndex, 1);
  } else {
    console.warn(`cannot remove peerId ${peerId}, does not exist in peer list`);
  }
};

const onExitWorld = (ctx: GameState, message: ExitWorldMessage) => {
  const network = getModule(ctx, NetworkModule);
  network.hostId = "";
  network.peers = [];
  network.newPeers = [];
  network.peerIdToEntityId.clear();
  network.entityIdToPeerId.clear();
  network.networkIdToEntityId.clear();
  network.localIdCount = 0;
  network.removedLocalIds = [];
  network.commands = [];
  // drain ring buffers
  const ringOut = { packet: new ArrayBuffer(0), peerId: "", broadcast: false };
  while (availableRead(network.outgoingRingBuffer)) dequeueNetworkRingBuffer(network.outgoingRingBuffer, ringOut);
  while (availableRead(network.incomingRingBuffer)) dequeueNetworkRingBuffer(network.incomingRingBuffer, ringOut);
};

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
      embodyAvatar(ctx, physics, input, eid);
    }

    // if host was re-elected, transfer ownership of old host's networked entities to new host
    if (newHostElected) {
      network.localIdCount = 0;
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
          // TODO: re-send this from the host side either via explicit message or via creation message
          // or deterministically set it here
          // explicit message: NID -> NID
          // Networked.networkId[eid] = setPeerIdIndexInNetworkId(nid, newHostPeerIndex);
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
  // TODO: split net ID into 2 32bit ints
  // ownerId: Types.ui32,
  // localId: Types.ui32,
  parent: Types.ui32,
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
