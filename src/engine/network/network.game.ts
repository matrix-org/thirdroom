import { addComponent, defineQuery, enterQuery, exitQuery, Not } from "bitecs";
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
import { Historian } from "./Historian";
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
import { RemoteNode } from "../resource/RemoteResources";
import { Networked, Authoring, Relaying } from "./NetworkComponents";
import { Replicator } from "./Replicator";
import { createQueue } from "../utils/Queue";
import { Message } from "../module/module.common";
import { NetworkReplicator, tryGetNetworkReplicator } from "./NetworkReplicator";
import { waitUntil } from "../utils/waitUntil";
import { ThirdRoomModule } from "../../plugins/thirdroom/thirdroom.game";
import { XRMode } from "../renderer/renderer.common";

/*********
 * Types *
 ********/

// TODO: nominalize so the types are not interchangeable: bigint & { __brand: "Brand Name" }
export type PeerID = bigint;
export type NetworkID = bigint;

// TODO: compress relevant properties from GameNetworkState onto PeerInfo
export interface PeerInfo {
  key: string;
  // TODO: make component on entity
  xrMode: XRMode;
  lastUpdate: number;
  id?: PeerID;
  networkId?: NetworkID;
  entityId?: number;
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

  // ScriptReplicator
  prefabToReplicator: Map<string, Replicator>;
  deferredUpdates: Map<bigint, DeferredUpdate[]>;

  // PeerInfo
  host?: PeerInfo;
  local?: PeerInfo;
  peers: PeerInfo[];
  peerIdCount: PeerID;
  peerKeyToInfo: Map<string, PeerInfo>;
  peerIdToInfo: Map<PeerID, PeerInfo>;
  // TODO: derive from Networked.authorId instead
  entityIdToPeer: Map<number, PeerInfo>;

  // NetworkId
  networkIdToEntityId: Map<NetworkID, number>;
  networkIdCount: NetworkID;

  // old
  localIdCount: number;
  removedLocalIds: number[];

  // Messages
  messageHandlers: {
    [key: number]: (ctx: GameContext, v: CursorView, peerId: string) => void;
  };
  cursorView: CursorView;
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

export const newPeersQueue = createQueue<PeerInfo>();

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
      peers: [],
      peerKeyToInfo: new Map(),
      peerIdToInfo: new Map(),
      entityIdToPeer: new Map(),
      peerIdCount: 1n,

      // NetworkID
      networkIdCount: 1n,
      localIdCount: 1,
      removedLocalIds: [],
      networkIdToEntityId: new Map(),

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

export const addPeerId = (ctx: GameContext, peerKey: string) => {
  console.info("addPeerId", peerKey);
  const network = getModule(ctx, NetworkModule);

  if (network.peers.some((p) => p.key === peerKey) || network.local?.key === peerKey) {
    return;
  }

  if (isHost(network)) {
    const peerId = network.peerIdCount++;
    const peerInfo = addPeerInfo(network, peerKey, peerId);
    // queue peer up for avatar creation and host snapshot
    newPeersQueue.enqueue(peerInfo);
    ctx.sendMessage<PeerEnteredMessage>(Thread.Game, { type: NetworkMessageType.PeerEntered, peerIndex: peerId });
  } else {
    waitUntil<bigint>(() => network.local?.id).then((peerId) => {
      ctx.sendMessage<PeerEnteredMessage>(Thread.Game, { type: NetworkMessageType.PeerEntered, peerIndex: peerId });
    });
  }
};

const onAddPeerId = (ctx: GameContext, message: AddPeerIdMessage) => addPeerId(ctx, message.peerId);

export const removePeerId = (ctx: GameContext, peerKey: string) => {
  const network = getModule(ctx, NetworkModule);
  if (!isHost(network)) {
    return;
  }

  const peerArrIndex = network.peers.findIndex((p) => p.key === peerKey);
  const peerId = network.peers[peerArrIndex]?.id;

  if (peerArrIndex > -1 && peerId) {
    const entities = networkedQuery(ctx.world);

    for (let i = entities.length - 1; i >= 0; i--) {
      const eid = entities[i];

      // skip if the entity does not belong to this peer
      if (Networked.authorId[eid] !== Number(peerId)) {
        continue;
      }

      const node = tryGetRemoteResource<RemoteNode>(ctx, eid);

      const hosting = isHost(network);
      const destroyOnLeave = Networked.destroyOnLeave[eid];

      if (hosting && destroyOnLeave) {
        const replicator = tryGetNetworkReplicator(network, Networked.replicatorId[eid]);

        replicator.despawn(node);
      }
    }

    removePeerInfo(network, peerKey);

    ctx.sendMessage<PeerExitedMessage>(Thread.Game, { type: NetworkMessageType.PeerExited, peerIndex: peerId });
  } else {
    console.warn(`cannot remove peerId ${peerKey}, does not exist in peer list`);
  }
};

const onRemovePeerId = (ctx: GameContext, message: RemovePeerIdMessage) => removePeerId(ctx, message.peerId);

const onExitWorld = (ctx: GameContext) => {
  const network = getModule(ctx, NetworkModule);

  // PeerInfo
  network.host = undefined;
  network.local = undefined;
  network.peers = [];
  network.entityIdToPeer.clear();
  network.networkIdToEntityId.clear();
  network.peerKeyToInfo.clear();
  network.peerIdToInfo.clear();
  network.peerIdCount = 1n;

  // NetworkID
  network.networkIdCount = 1n;

  // TODO: remove
  network.localIdCount = 1;
  network.removedLocalIds = [];

  // drain queues
  const ringOut = { packet: new ArrayBuffer(0), peerKey: "", broadcast: false };
  while (availableRead(network.outgoingReliableRingBuffer))
    dequeueNetworkRingBuffer(network.outgoingReliableRingBuffer, ringOut);
  while (availableRead(network.incomingReliableRingBuffer))
    dequeueNetworkRingBuffer(network.incomingReliableRingBuffer, ringOut);

  while (threadMessageQueue.length) threadMessageQueue.dequeue();
  while (newPeersQueue.length) newPeersQueue.dequeue();
};

const onSetHost = async (ctx: GameContext, message: SetHostMessage) => {
  const network = getModule(ctx, NetworkModule);
  const hostKey = message.hostId;

  const hostInfo = network.peers.find((p) => p.key === hostKey);

  if (hostInfo) {
    network.host = hostInfo;
  } else {
    const id = isHost(network) ? network.host?.id : undefined;
    network.host = {
      id,
      key: hostKey,
      lastUpdate: 0,
      xrMode: XRMode.None,
    };
  }
};

/* Utils */

export const addPeerInfo = (network: GameNetworkState, peerKey: string, peerId: PeerID) => {
  if (network.peers.some((p) => p.key === peerKey)) {
    throw new Error("PeerInfo already exists for peerKey " + peerKey);
  }

  const peerInfo: PeerInfo & { id: PeerID } = {
    id: peerId,
    key: peerKey,
    // TODO
    xrMode: XRMode.None,
    lastUpdate: 0,
  };

  network.peerIdToInfo.set(peerId, peerInfo);
  network.peerKeyToInfo.set(peerKey, peerInfo);
  network.peers.push(peerInfo);

  return peerInfo;
};

export const removePeerInfo = (network: GameNetworkState, peerKey: string) => {
  const i = network.peers.findIndex((p) => p.key === peerKey);
  if (i === -1) {
    throw new Error("PeerInfo does not exist for peerKey " + peerKey);
  }

  const peerInfo = network.peers[i];

  if (peerInfo.entityId) network.entityIdToPeer.delete(peerInfo.entityId);
  if (peerInfo.id) network.peerIdToInfo.delete(peerInfo.id);
  network.peerKeyToInfo.delete(peerInfo.key);
  network.peers.splice(i, 1);
};

export const tryGetPeerId = (network: GameNetworkState, peerKey: string) => {
  const peerInfo = network.peerKeyToInfo.get(peerKey);
  if (!peerInfo || !peerInfo.id) {
    throw new Error("PeerId not found for peerKey: " + peerKey);
  }
  return peerInfo.id;
};

export const getPeerId = (network: GameNetworkState, peerKey: string) => network.peerKeyToInfo.get(peerKey)?.id;
export const getPeerKey = (network: GameNetworkState, peerId: PeerID) => network.peerIdToInfo.get(peerId)?.key;

function _throw(m: string): PeerInfo {
  throw new Error(m);
}

export const getPeerInfoById = (network: GameNetworkState, peerId: PeerID) => network.peerIdToInfo.get(peerId);
export const tryGetPeerInfoById = (network: GameNetworkState, peerId: PeerID) =>
  network.peerIdToInfo.get(peerId) || _throw("PeerInfo not found for peerId: " + peerId);

export const getPeerInfoByKey = (network: GameNetworkState, peerKey: string) => network.peerKeyToInfo.get(peerKey);
export const tryGetPeerInfoByKey = (network: GameNetworkState, peerKey: string): PeerInfo =>
  network.peerKeyToInfo.get(peerKey) || _throw("PeerInfo not found for peerKey: " + peerKey);

export const createNetworkId = (network: GameNetworkState) => {
  return network.networkIdCount++;
};

/* Queries */

export const networkedQuery = defineQuery([Networked]);
export const exitedNetworkedQuery = exitQuery(networkedQuery);

export const relayingNetworkedQuery = defineQuery([Networked, Relaying]);

export const authoringNetworkedQuery = defineQuery([Networked, Authoring]);
export const spawnedNetworkeQuery = enterQuery(authoringNetworkedQuery);
export const despawnedNetworkQuery = exitQuery(authoringNetworkedQuery);

export const remoteNetworkedQuery = defineQuery([Networked, Not(Authoring)]);

export const ownedPlayerQuery = defineQuery([OurPlayer, Authoring]);

const MessageTypeHandler: { [key: string]: Function } = {
  [NetworkMessageType.SetHost]: onSetHost,
  [NetworkMessageType.AddPeerId]: onAddPeerId,
  [NetworkMessageType.RemovePeerId]: onRemovePeerId,
  [ThirdRoomMessageType.ExitWorld]: onExitWorld,
};

export function HostSpawnPeerAvatarSystem(ctx: GameContext) {
  const thirdroom = getModule(ctx, ThirdRoomModule);
  const network = getModule(ctx, NetworkModule);

  if (!isHost(network)) {
    return;
  }

  // don't drain the queue, it is later drained by the OutboundNetworkSystem
  for (const peerInfo of newPeersQueue) {
    const avatar = thirdroom.replicators!.avatar.spawn(ctx);

    addComponent(ctx.world, Relaying, avatar.eid);
    Relaying.for[avatar.eid] = Number(peerInfo.id);
    Networked.authorId[avatar.eid] = Number(peerInfo.id);
  }
}

export function NetworkThreadedMessageQueueSystem(ctx: GameContext) {
  let message;
  while ((message = threadMessageQueue.dequeue())) {
    MessageTypeHandler[message.type](ctx, message);
  }
}
