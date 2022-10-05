import { Message } from "../module/module.common";
import { NetworkRingBuffer } from "./RingBuffer";

export enum NetworkMessageType {
  // Main -> Game
  NetworkMessage = "reliable-network-message",
  NetworkBroadcast = "reliable-network-broadcast",
  InitializeNetworkState = "InitializeNetworkState",

  // Game -> Main
  SetPeerId = "set-peer-id",
  AddPeerId = "add-peer-id",
  RemovePeerId = "remove-peer-id",
  SetHost = "set-host",
}

// Main -> Game

export interface NetworkMessage extends Message<NetworkMessageType.NetworkMessage> {
  peerId: string;
  packet: ArrayBuffer;
  reliable: boolean;
}

export interface NetworkBroadcast extends Message<NetworkMessageType.NetworkBroadcast> {
  packet: ArrayBuffer;
  reliable: boolean;
}

export interface InitializeNetworkStateMessage extends Message<NetworkMessageType.InitializeNetworkState> {
  incomingRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  outgoingRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
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

export interface SetHostMessage extends Message<NetworkMessageType.SetHost> {
  hostId: string;
}
