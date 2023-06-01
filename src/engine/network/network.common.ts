import { NetworkRingBuffer } from "./NetworkRingBuffer";

export enum NetworkMessageType {
  InitializeNetworkState = "InitializeNetworkState",
  Connect = "connect",
  Reconnect = "reconnect",
  AddPeer = "add-peer",
  RemovePeer = "remove-peer",
  SetHost = "set-host",
  Disconnect = "disconnect",
}

export enum NetworkPacketType {
  Message,
  Spawn,
  Despawn,
  Sync,
}

export interface Peer {
  peerId: number;
  key: string;
  displayName: string;
}

// Main -> Game

export interface InitializeNetworkStateMessage {
  type: NetworkMessageType.InitializeNetworkState;
  incomingRingBuffer: NetworkRingBuffer;
  outgoingRingBuffer: NetworkRingBuffer;
}

export interface ConnectMessage {
  type: NetworkMessageType.Connect;
  peers: Peer[];
  localPeerId: number;
  hostPeerId: number;
}

export interface ReconnectMessage {
  type: NetworkMessageType.Reconnect;
}

export interface AddPeerMessage {
  type: NetworkMessageType.AddPeer;
  peer: Peer;
  hostPeerId: number;
}

export interface RemovePeerMessage {
  type: NetworkMessageType.RemovePeer;
  peerId: number;
  hostPeerId: number;
}

export interface SetHostMessage {
  type: NetworkMessageType.SetHost;
  hostPeerId: number;
}

export interface DisconnectMessage {
  type: NetworkMessageType.Disconnect;
}
