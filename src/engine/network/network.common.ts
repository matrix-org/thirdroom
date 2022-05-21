import { Message } from "../types/types.common";

export enum NetworkMessageType {
  // Main -> Game
  ReliableNetworkMessage = "reliable-network-message",
  ReliableNetworkBroadcast = "reliable-network-broadcast",
  UnreliableNetworkMessage = "unreliable-network-message",
  UnreliableNetworkBroadcast = "unreliable-network-broadcast",

  // Game -> Main
  SetPeerId = "set-peer-id",
  AddPeerId = "add-peer-id",
  RemovePeerId = "remove-peer-id",
  StateChanged = "state-changed",
  SetHost = "set-host",
}

// Main -> Game

export interface ReliableNetworkMessage extends Message<NetworkMessageType.ReliableNetworkMessage> {
  peerId: string;
  packet: ArrayBuffer;
}

export interface UnreliableNetworkMessage extends Message<NetworkMessageType.UnreliableNetworkMessage> {
  peerId: string;
  packet: ArrayBuffer;
}

export interface ReliableNetworkBroadcast extends Message<NetworkMessageType.ReliableNetworkBroadcast> {
  packet: ArrayBuffer;
}

export interface UnreliableNetworkBroadcast extends Message<NetworkMessageType.UnreliableNetworkBroadcast> {
  packet: ArrayBuffer;
}

// Game -> Main

export interface SetPeerIdMessage extends Message<NetworkMessageType.SetPeerId> {
  peerId: string;
}

export interface AddPeerIdMessage extends Message<NetworkMessageType.AddPeerId> {
  peerId: string;
}

export interface RemovePeerIdMessage extends Message<NetworkMessageType.RemovePeerId> {
  peerId: string;
}

export interface StateChangedMessage extends Message<NetworkMessageType.StateChanged> {
  state: any;
}

export interface SetHostMessage extends Message<NetworkMessageType.SetHost> {
  value: boolean;
}
