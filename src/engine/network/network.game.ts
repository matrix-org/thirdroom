import { defineQuery, enterQuery, exitQuery, Not } from "bitecs";
import { availableRead } from "@thirdroom/ringbuffer";

import { createCursorView, CursorView } from "../allocator/CursorView";
import { GameContext } from "../GameTypes";
import { OurPlayer } from "../player/Player";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  AddPeerIdMessage,
  InitializeNetworkStateMessage,
  isHost,
  NetworkMessageType,
  PeerEnteredMessage,
  PeerExitedMessage,
  RemovePeerIdMessage,
  SetHostMessage,
} from "./network.common";
import { createHistorian, Historian } from "./Historian";
import {
  deserializeEntityUpdates,
  deserializeHostCommands,
  deserializeHostSnapshot,
  deserializePeerEntered,
  deserializePeerExited,
  NetworkMessage,
} from "./NetworkMessage";
import { registerInboundMessageHandler } from "./InboundNetworkSystem";
import { dequeueNetworkRingBuffer, NetworkRingBuffer } from "./NetworkRingBuffer";
import { ExitWorldMessage, ThirdRoomMessageType } from "../../plugins/thirdroom/thirdroom.common";
import { tryGetRemoteResource } from "../resource/resource.game";
import { RemoteNode, removeObjectFromWorld } from "../resource/RemoteResources";
import { Networked, Authoring, Relaying } from "./NetworkComponents";
import { XRMode } from "../renderer/renderer.common";
import { Replicator } from "./Replicator";
import { createQueue, Queue } from "../utils/Queue";
import { Message } from "../module/module.common";
import { NetworkReplicator } from "./NetworkReplicator";
import { waitUntil } from "../utils/waitUntil";

/*********
 * Types *
 ********/

// TODO: nominalize so the types are not interchangeable: bigint & { __brand: "Brand Name" }
export type PeerIndex = bigint;
export type NetworkID = bigint;

// TODO: compress relevant properties from GameNetworkState onto PeerInfo
export interface PeerInfo {
  peerIndex: PeerIndex;
  peerId: string;
  xrMode: XRMode;
  lastUpdate: number;
  entityId?: number;
  networkId?: NetworkID;
  historian?: Historian;
}

export interface DeferredUpdate {
  position: Float32Array;
  quaternion: Float32Array;
}

export interface GameNetworkState {
  // NetworkReplicator
  replicatorIdCount: number;
  replicators: Map<number, NetworkReplicator<never>>;
  prefabToReplicator: Map<string, Replicator>;
  deferredUpdates: Map<bigint, DeferredUpdate[]>;

  // PeerInfo
  hostId: string;
  peerId: string;
  peers: string[];
  newPeers: Queue<string>;
  peerIndexCount: PeerIndex;
  peerIdToIndex: Map<string, PeerIndex>;
  indexToPeerId: Map<PeerIndex, string>;
  peerIdToHistorian: Map<string, Historian>;
  peerIdToEntityId: Map<string, number>;
  peerIdToXRMode: Map<string, XRMode>;
  peerIdToTime: Map<string, number>;
  entityIdToPeerId: Map<number, string>;

  // NetworkId
  networkIdToEntityId: Map<NetworkID, number>;
  networkIdCount: NetworkID;
  localIdCount: number;
  removedLocalIds: number[];

  // Messages
  messageHandlers: {
    [key: number]: (ctx: GameContext, v: CursorView, peerId: string) => void;
  };
  cursorView: CursorView;
  // TODO: unify into single ringbuffer?
  incomingReliableRingBuffer: NetworkRingBuffer;
  incomingUnreliableRingBuffer: NetworkRingBuffer;
  outgoingReliableRingBuffer: NetworkRingBuffer;
  outgoingUnreliableRingBuffer: NetworkRingBuffer;

  // feature flags
  tickRate: number;
  interpolate: boolean;
}

/******************
 * Initialization *
 *****************/

const threadMessageQueue = createQueue<Message<NetworkMessageType | ThirdRoomMessageType>>();

export const newPeersQueue = createQueue<string>();

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
      // NetworkReplicator
      replicatorIdCount: 1,
      replicators: new Map(),
      prefabToReplicator: new Map(),
      deferredUpdates: new Map(),

      // PeerInfo
      hostId: "",
      peerId: "",
      peers: [],
      newPeers: createQueue<string>(),
      peerIdToIndex: new Map(),
      indexToPeerId: new Map(),
      peerIdToHistorian: new Map(),
      networkIdToEntityId: new Map(),
      peerIdToEntityId: new Map(),
      peerIdToXRMode: new Map(),
      peerIdToTime: new Map(),
      entityIdToPeerId: new Map(),
      peerIndexCount: 1n,

      // NetworkID
      networkIdCount: 1n,
      localIdCount: 1,
      removedLocalIds: [],

      // Messages
      messageHandlers: {},
      cursorView: createCursorView(),
      incomingReliableRingBuffer,
      incomingUnreliableRingBuffer,
      outgoingReliableRingBuffer,
      outgoingUnreliableRingBuffer,

      // feature flags
      tickRate: 60,
      interpolate: false,
    };
  },
  init(ctx: GameContext) {
    const network = getModule(ctx, NetworkModule);

    registerInboundMessageHandler(network, NetworkMessage.HostSnapshot, deserializeHostSnapshot);
    registerInboundMessageHandler(network, NetworkMessage.HostCommands, deserializeHostCommands);
    registerInboundMessageHandler(network, NetworkMessage.EntityUpdates, deserializeEntityUpdates);
    registerInboundMessageHandler(network, NetworkMessage.PeerEntered, deserializePeerEntered);
    registerInboundMessageHandler(network, NetworkMessage.PeerExited, deserializePeerExited);

    const disposables = [
      registerMessageHandler(ctx, NetworkMessageType.SetHost, (ctx: GameContext, message: SetHostMessage) => {
        threadMessageQueue.enqueue(message);
      }),
      registerMessageHandler(ctx, NetworkMessageType.AddPeerId, (ctx: GameContext, message: AddPeerIdMessage) => {
        threadMessageQueue.enqueue(message);
      }),
      registerMessageHandler(ctx, NetworkMessageType.RemovePeerId, (ctx: GameContext, message: RemovePeerIdMessage) => {
        threadMessageQueue.enqueue(message);
      }),
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, (ctx: GameContext, message: ExitWorldMessage) => {
        threadMessageQueue.enqueue(message);
      }),
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
  newPeersQueue.enqueue(peerId);

  network.peerIdToHistorian.set(peerId, createHistorian());

  if (isHost(network)) {
    const peerIndex = network.peerIndexCount++;
    mapPeerIndex(network, peerId, peerIndex);
    ctx.sendMessage<PeerEnteredMessage>(Thread.Game, { type: NetworkMessageType.PeerEntered, peerIndex });
  } else {
    waitUntil<bigint>(() => getPeerIndex(network, peerId)).then((peerIndex) => {
      ctx.sendMessage<PeerEnteredMessage>(Thread.Game, { type: NetworkMessageType.PeerEntered, peerIndex });
    });
  }
};

const onAddPeerId = (ctx: GameContext, message: AddPeerIdMessage) => addPeerId(ctx, message.peerId);

export const removePeerId = (ctx: GameContext, peerId: string) => {
  const network = getModule(ctx, NetworkModule);

  const peerArrIndex = network.peers.indexOf(peerId);
  const peerIndex = getPeerIndex(network, peerId);

  if (isHost(network)) {
    if (peerArrIndex > -1 && peerIndex) {
      const entities = networkedQuery(ctx.world);

      for (let i = entities.length - 1; i >= 0; i--) {
        const eid = entities[i];
        const node = tryGetRemoteResource<RemoteNode>(ctx, eid);

        const hosting = isHost(network);
        const destroyOnLeave = Networked.destroyOnLeave[eid];

        if (hosting && destroyOnLeave) {
          network.entityIdToPeerId.delete(eid);
          removeObjectFromWorld(ctx, node);
        }
      }

      network.peers.splice(peerArrIndex, 1);
      unmapPeerIndex(network, peerId);

      ctx.sendMessage<PeerExitedMessage>(Thread.Game, { type: NetworkMessageType.PeerExited, peerIndex });
    } else {
      console.warn(`cannot remove peerId ${peerId}, does not exist in peer list`);
    }
  }
};

const onRemovePeerId = (ctx: GameContext, message: RemovePeerIdMessage) => removePeerId(ctx, message.peerId);

const onExitWorld = (ctx: GameContext) => {
  const network = getModule(ctx, NetworkModule);

  // PeerInfo
  network.hostId = "";
  network.peers = [];
  network.peerIdToEntityId.clear();
  network.entityIdToPeerId.clear();
  network.networkIdToEntityId.clear();
  network.peerIdToIndex.clear();
  network.indexToPeerId.clear();
  network.peerIndexCount = 1n;

  // NetworkID
  network.networkIdCount = 1n;
  network.localIdCount = 1;
  network.removedLocalIds = [];

  // drain ring buffers
  const ringOut = { packet: new ArrayBuffer(0), peerId: "", broadcast: false };
  while (availableRead(network.outgoingReliableRingBuffer))
    dequeueNetworkRingBuffer(network.outgoingReliableRingBuffer, ringOut);
  while (availableRead(network.incomingReliableRingBuffer))
    dequeueNetworkRingBuffer(network.incomingReliableRingBuffer, ringOut);

  while (threadMessageQueue.length) threadMessageQueue.dequeue();
  while (newPeersQueue.length) newPeersQueue.dequeue();
};

// Set local peer id
export const setLocalPeerId = (ctx: GameContext, localPeerId: string) => {
  const network = getModule(ctx, NetworkModule);
  network.peerId = localPeerId;

  if (isHost(network)) {
    const peerIndex = network.peerIndexCount++;
    mapPeerIndex(network, localPeerId, peerIndex);
  }
};

const onSetHost = async (ctx: GameContext, message: SetHostMessage) => {
  const network = getModule(ctx, NetworkModule);
  const newHostId = message.hostId;
  network.hostId = newHostId;
};

/* Utils */

export const mapPeerIndex = (network: GameNetworkState, peerId: string, peerIndex: PeerIndex) => {
  network.peerIdToIndex.set(peerId, peerIndex);
  network.indexToPeerId.set(peerIndex, peerId);
  // this keeps peerIdCount synchronized on all peers
  if (peerIndex > network.peerIndexCount) {
    network.peerIndexCount = peerIndex;
  }
};

export const unmapPeerIndex = (network: GameNetworkState, peerId: string) => {
  const i = tryGetPeerIndex(network, peerId);
  network.indexToPeerId.delete(i);
  network.peerIdToIndex.delete(peerId);
  // this keeps peerIdCount synchronized on all peers
  network.peerIndexCount--;
};

export const tryGetPeerIndex = (network: GameNetworkState, peerId: string) => {
  const peerIndex = network.peerIdToIndex.get(peerId);
  if (!peerIndex) {
    throw new Error("PeerIndex not found for PeerId: " + peerId);
  }
  return peerIndex;
};

export const getPeerIndex = (network: GameNetworkState, peerId: string) => network.peerIdToIndex.get(peerId);

export const createNetworkId = (network: GameNetworkState) => {
  return network.networkIdCount++;
};

export const associatePeerWithEntity = (network: GameNetworkState, peerId: string, eid: number) => {
  Networked.authorIndex[eid] = Number(tryGetPeerIndex(network, peerId));
  network.peerIdToEntityId.set(peerId, eid);
  // TODO: replace with Networked.authorIndex
  network.entityIdToPeerId.set(eid, peerId);
};

/* Queries */

export const networkedQuery = defineQuery([Networked]);
export const exitedNetworkedQuery = exitQuery(networkedQuery);

export const relayingNetworkedQuery = defineQuery([Networked, Relaying]);

export const authoringNetworkedQuery = defineQuery([Networked, Authoring]);
export const spawnedNetworkeQuery = enterQuery(authoringNetworkedQuery);
export const despawnedNetworkQuery = exitQuery(authoringNetworkedQuery);

export const remoteNetworkedQuery = defineQuery([Networked, Not(Authoring)]);

// bitecs todo: add defineQueue to bitECS / allow multiple enter/exit queries to avoid duplicate query
// export const networkIdQuery = defineQuery([Networked, Authoring]);
// export const enteredNetworkIdQuery = enterQuery(networkIdQuery);
// export const exitedNetworkIdQuery = exitQuery(networkIdQuery);

export const ownedPlayerQuery = defineQuery([OurPlayer, Authoring]);
// export const enteredOwnedPlayerQuery = enterQuery(ownedPlayerQuery);
// export const exitedOwnedPlayerQuery = exitQuery(ownedPlayerQuery);

// export const remotePlayerQuery = defineQuery([Player, Not(Authoring)]);
// export const enteredRemotePlayerQuery = enterQuery(remotePlayerQuery);
// export const exitedRemotePlayerQuery = exitQuery(remotePlayerQuery);

const MessageTypeHandler: { [key: string]: Function } = {
  [NetworkMessageType.SetHost]: onSetHost,
  [NetworkMessageType.AddPeerId]: onAddPeerId,
  [NetworkMessageType.RemovePeerId]: onRemovePeerId,
  [ThirdRoomMessageType.ExitWorld]: onExitWorld,
};

export function NetworkThreadedMessageQueueSystem(ctx: GameContext) {
  let message;
  while ((message = threadMessageQueue.dequeue())) {
    MessageTypeHandler[message.type](ctx, message);
  }
}
