import { Message } from "../module/module.common";
import { GameNetworkState } from "./network.game";
import { MainNetworkState } from "./network.main";
import { NetworkRingBuffer } from "./RingBuffer";

export enum NetworkMessageType {
  // Main -> Game
  InitializeNetworkState = "InitializeNetworkState",

  // Game -> Main
  SetPeerId = "set-peer-id",
  AddPeerId = "add-peer-id",
  RemovePeerId = "remove-peer-id",
  SetHost = "set-host",
}

// Main -> Game

export interface InitializeNetworkStateMessage extends Message<NetworkMessageType.InitializeNetworkState> {
  incomingReliableRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  incomingUnreliableRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  outgoingReliableRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  outgoingUnreliableRingBuffer: NetworkRingBuffer<Uint8ArrayConstructor>;
  authoritative: boolean;
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

export const isHost = (network: GameNetworkState | MainNetworkState): boolean =>
  !!network.peerId && !!network.hostId && network.hostId === network.peerId;
