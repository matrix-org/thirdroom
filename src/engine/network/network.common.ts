import { Message } from "../module/module.common";
import { GameNetworkState } from "./network.game";
import { MainNetworkState } from "./network.main";
import { NetworkRingBuffer } from "./RingBuffer";

export enum NetworkMessageType {
  // Main -> Game
  InitializeNetworkState = "InitializeNetworkState",

  // Game -> Main
  AddPeerId = "add-peer-id",
  RemovePeerId = "remove-peer-id",
  SetHost = "set-host",

  // Game -> Game
  PeerEntered = "peer-entered",
  PeerExited = "peer-exited",
}

// Main -> Game

export interface InitializeNetworkStateMessage extends Message<NetworkMessageType.InitializeNetworkState> {
  incomingReliableRingBuffer: NetworkRingBuffer;
  incomingUnreliableRingBuffer: NetworkRingBuffer;
  outgoingReliableRingBuffer: NetworkRingBuffer;
  outgoingUnreliableRingBuffer: NetworkRingBuffer;
}

// Game -> Main

export interface AddPeerIdMessage extends Message<NetworkMessageType.AddPeerId> {
  peerId: string;
}

export interface RemovePeerIdMessage extends Message<NetworkMessageType.RemovePeerId> {
  peerId: string;
}

export interface SetHostMessage extends Message<NetworkMessageType.SetHost> {
  hostId: string;
}

export interface PeerEnteredMessage extends Message<NetworkMessageType.PeerEntered> {
  peerIndex: number;
}

export interface PeerExitedMessage extends Message<NetworkMessageType.PeerExited> {
  peerIndex: number;
}

export const isHost = (network: GameNetworkState | MainNetworkState): boolean =>
  !!network.peerId && !!network.hostId && network.hostId === network.peerId;
