import { CursorView } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  NetworkMessageType,
  InitializeNetworkStateMessage,
  AddPeerMessage,
  RemovePeerMessage,
  SetHostMessage,
  Peer,
  ConnectMessage,
  ReconnectMessage,
} from "./network.common";
import { disposeNetworkRingBuffer, NetworkRingBuffer } from "./NetworkRingBuffer";
import { NetworkReplicator } from "./NetworkReplicator";
import { NetworkSynchronizer } from "./NetworkSynchronizer";
import { createDisposables } from "../utils/createDisposables";
import { ScriptComponent, scriptQuery } from "../scripting/scripting.game";

/*********
 * Types *
 ********/

export type NetworkMessageHandler = (ctx: GameState, from: number, cursorView: CursorView) => void;

export type PeerHandler = (ctx: GameState, peerId: number) => void;

export interface GameNetworkState {
  connected: boolean;
  tickRate: number;
  incomingRingBuffer: NetworkRingBuffer;
  outgoingRingBuffer: NetworkRingBuffer;
  localPeerId: number;
  hostPeerId: number;
  connectedPeers: number[];
  peerInfo: Map<number, Peer>;
  networkIdToEntityId: Map<number, number>;
  replicators: Map<number, NetworkReplicator>;
  synchronizers: Map<number, NetworkSynchronizer>;
  messageQueue: any[];
  messageHandlers: Map<number, NetworkMessageHandler>;
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
      connected: false,
      tickRate: 10,
      incomingRingBuffer,
      outgoingRingBuffer,
      localPeerId: 0,
      hostPeerId: 0,
      connectedPeers: [],
      peerInfo: new Map(),
      networkIdToEntityId: new Map(),
      replicators: new Map(),
      synchronizers: new Map(),
      messageQueue: [],
      messageHandlers: new Map(),
    };
  },
  init(ctx: GameState) {
    const network = getModule(ctx, NetworkModule);

    const queueMessage = (ctx: GameState, message: any) => {
      network.messageQueue.push(message);
    };

    return createDisposables([
      registerMessageHandler(ctx, NetworkMessageType.Connect, queueMessage),
      registerMessageHandler(ctx, NetworkMessageType.Reconnect, queueMessage),
      registerMessageHandler(ctx, NetworkMessageType.AddPeer, queueMessage),
      registerMessageHandler(ctx, NetworkMessageType.RemovePeer, queueMessage),
      registerMessageHandler(ctx, NetworkMessageType.SetHost, queueMessage),
      registerMessageHandler(ctx, NetworkMessageType.Disconnect, queueMessage),
    ]);
  },
});

export function NetworkStateSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  while (network.messageQueue.length) {
    const message = network.messageQueue.shift();

    switch (message.type) {
      case NetworkMessageType.Connect:
        onConnect(ctx, message);
        break;
      case NetworkMessageType.Reconnect:
        onReconnect(ctx, message);
        break;
      case NetworkMessageType.AddPeer:
        onAddPeer(ctx, message);
        break;
      case NetworkMessageType.RemovePeer:
        onRemovePeer(ctx, message);
        break;
      case NetworkMessageType.SetHost:
        onSetHost(ctx, message);
        break;
      case NetworkMessageType.Disconnect:
        onDisconnect(ctx);
        break;
    }
  }
}

function onConnect(ctx: GameState, message: ConnectMessage) {
  const network = getModule(ctx, NetworkModule);

  if (network.connected) {
    throw new Error("Attempted to connect to network when already connected");
  }

  network.connected = true;
}

function onReconnect(ctx: GameState, message: ReconnectMessage) {
  const network = getModule(ctx, NetworkModule);

  const entities = scriptQuery(ctx.world);

  for (let i = 0; i < network.connectedPeers.length; i++) {
    const peerId = network.connectedPeers[i];

    removePlayer(ctx, peerId);

    const entities = scriptQuery(ctx.world);

    for (let e = 0; e < entities.length; e++) {
      const eid = entities[e];
      const script = ScriptComponent.get(eid);
      script?.peerExited(peerId);
    }
  }

  for (let i = 0; i < network.connectedPeers.length; i++) {
    const peerId = network.connectedPeers[i];

    addPlayer(ctx, peerId);

    for (let e = 0; e < entities.length; e++) {
      const eid = entities[e];
      const script = ScriptComponent.get(eid);
      script?.peerEntered(peerId);
    }
  }
}

function onAddPeer(ctx: GameState, message: AddPeerMessage) {
  const network = getModule(ctx, NetworkModule);

  if (!network.connected) {
    throw new Error("Attempted to add peer when not connected to network");
  }

  const peerId = message.peer.peerId;

  if (network.connectedPeers.includes(peerId)) {
    return;
  }

  network.connectedPeers.push(peerId);
  network.peerInfo.set(peerId, message.peer);

  addPlayer(ctx, peerId);

  const entities = scriptQuery(ctx.world);

  for (let e = 0; e < entities.length; e++) {
    const eid = entities[e];
    const script = ScriptComponent.get(eid);
    script?.peerEntered(peerId);
  }
}

function onRemovePeer(ctx: GameState, message: RemovePeerMessage) {
  const network = getModule(ctx, NetworkModule);

  if (!network.connected) {
    throw new Error("Attempted to remove peer when not connected to network");
  }

  const peerId = message.peerId;
  const index = network.connectedPeers.indexOf(peerId);

  if (index === -1) {
    console.warn(`Attempted to remove peer ${peerId} that isn't connected. Ignoring.`);
    return;
  }

  network.connectedPeers.splice(index, 1);
  network.peerInfo.delete(peerId);

  removePlayer(ctx, peerId);

  const entities = scriptQuery(ctx.world);

  for (let e = 0; e < entities.length; e++) {
    const eid = entities[e];
    const script = ScriptComponent.get(eid);
    script?.peerExited(peerId);
  }
}

function onSetHost(ctx: GameState, message: SetHostMessage) {
  const network = getModule(ctx, NetworkModule);

  if (!network.connected) {
    throw new Error("Attempted to set host when not connected to network");
  }

  if (network.hostPeerId === message.hostPeerId) {
    return;
  }

  network.hostPeerId = message.hostPeerId;

  // TODO: Handle host migration
}

function onDisconnect(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  if (!network.connected) {
    throw new Error("Attempted to disconnect from network when not connected");
  }

  network.connected = false;
  network.hostPeerId = 0;
  network.localPeerId = 0;
  network.connectedPeers.length = 0;
  network.peerInfo.clear();
  network.networkIdToEntityId.clear();
  disposeNetworkRingBuffer(network.incomingRingBuffer);
  disposeNetworkRingBuffer(network.outgoingRingBuffer);
}
