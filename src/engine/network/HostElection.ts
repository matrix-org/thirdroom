import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";

const GATHERING_PEERS_PERIOD = 5 * 1000;
const HOST_CONNECTION_TIMEOUT = 30 * 1000;
const LAST_RECEIVED_MESSAGE_TIMEOUT = 5 * 1000;

interface Member {
  userId: string;
  deviceId: string;
  displayName: string;
  powerLevel: number;
  memberEventTimestamp: number; // ?
}

interface Peer {
  local: boolean;
  userId: string;
  deviceId: string;
  displayName: string;
  peerId: string;
  powerLevel: number;
  memberEventTimestamp: number;
  lastReceivedMessage: number;
  connected: boolean;
}

const getPeerId = (userId: string, deviceId: string) => `${userId},${deviceId}`;

enum HostConnectionState {
  Disconnected, // We are not currently connected to a room.
  GatheringPeers, // We're waiting for the initial WebRTC connections to be established.
  Connecting, // We've picked a host but we're not connected yet.
  Connected, // We're currently connected to a host.
  Error, // Connection to a host could not be established.
}

interface NetworkModuleState {
  hostConnectionState: HostConnectionState;
  localPeerId?: string;
  currentRoomId?: string;
  currentHost?: Peer;
  peers: Peer[];
  peerIdMap: Map<string, Peer>;
  gatheringPeersTimeout: number;
  hostConnectionTimeout: number;
  hostNeedsUpdate: boolean;
}

export function createNetworkModuleState(): NetworkModuleState {
  return {
    hostConnectionState: HostConnectionState.Disconnected,
    localPeerId: undefined,
    currentRoomId: undefined,
    currentHost: undefined,
    peers: [],
    peerIdMap: new Map(),
    gatheringPeersTimeout: 0,
    hostConnectionTimeout: 0,
    hostNeedsUpdate: false,
  };
}

// Called when you enter the world
export function onConnect(
  ctx: GameState,
  network: NetworkModuleState,
  roomId: string,
  localUserId: string,
  localDeviceId: string
) {
  network.hostConnectionState = HostConnectionState.GatheringPeers;
  network.gatheringPeersTimeout = ctx.elapsed + GATHERING_PEERS_PERIOD;
  network.localPeerId = getPeerId(localUserId, localDeviceId);
  network.currentRoomId = roomId;

  ctx.sendMessage(Thread.Main, {
    type: "gathering-peers",
  });
}

// Called when you exit the world
export function onDisconnect(ctx: GameState, network: NetworkModuleState) {
  network.hostConnectionState = HostConnectionState.Disconnected;
  network.localPeerId = undefined;
  network.currentRoomId = undefined;
  network.currentHost = undefined;
  network.peers.length = 0;
  network.peerIdMap.clear();
  network.gatheringPeersTimeout = 0;
  network.hostConnectionTimeout = 0;
  network.hostNeedsUpdate = false;

  ctx.sendMessage(Thread.Main, {
    type: "disconnected",
  });
}

// Called when Hydrogen's GroupCall members changed. RTCPeerConnection may not be established yet.
export function onMembersChanged(network: NetworkModuleState, roomId: string, added: Member[], removed: Member[]) {
  if (roomId !== network.currentRoomId) {
    return;
  }

  for (const member of added) {
    const peerId = getPeerId(member.userId, member.deviceId);
    const local = network.localPeerId === undefined ? false : network.localPeerId === peerId;

    const peer: Peer = {
      local,
      userId: member.userId,
      deviceId: member.deviceId,
      peerId,
      displayName: member.displayName,
      powerLevel: member.powerLevel,
      memberEventTimestamp: member.memberEventTimestamp,
      lastReceivedMessage: 0,
      connected: local,
    };

    network.peers.push(peer);
    network.peerIdMap.set(peerId, peer);
  }

  for (const member of removed) {
    const peerId = getPeerId(member.userId, member.deviceId);
    const index = network.peers.findIndex((peer) => peer.peerId === peerId);

    if (index !== -1) {
      network.peers.splice(index, 1);
    }

    network.peerIdMap.delete(peerId);
  }

  network.hostNeedsUpdate = true;
}

// Called for every WebRTC message.
// Each client should broadcast a keep alive message every second if it hasn't sent any other messages.
export function onPeerMessageReceived(ctx: GameState, network: NetworkModuleState, peerId: string) {
  const peer = network.peerIdMap.get(peerId);

  if (!peer) {
    return;
  }

  peer.connected = true;
  peer.lastReceivedMessage = ctx.elapsed;
}

function hostComparator(a: Peer, b: Peer): number {
  if (a.powerLevel !== b.powerLevel) {
    return a.powerLevel - b.powerLevel;
  } else if (a.memberEventTimestamp !== b.memberEventTimestamp) {
    return a.memberEventTimestamp - b.memberEventTimestamp;
  } else {
    return a.peerId.localeCompare(b.peerId);
  }
}

export function updateConnectionStates(ctx: GameState, network: NetworkModuleState) {
  for (const peer of network.peers) {
    const peerTimeout =
      !peer.local && peer.connected && peer.lastReceivedMessage + LAST_RECEIVED_MESSAGE_TIMEOUT < ctx.elapsed;

    if (peerTimeout) {
      peer.connected = false;
    }
  }

  const gatheringPeersFinished =
    network.hostConnectionState === HostConnectionState.GatheringPeers && network.gatheringPeersTimeout > ctx.elapsed;
  const hostTimeout = network.hostConnectionState === HostConnectionState.Connected && !network.currentHost?.connected;
  const peersChanged = network.hostConnectionState === HostConnectionState.Connected && network.hostNeedsUpdate;

  if (gatheringPeersFinished || hostTimeout || peersChanged) {
    // If we just finished gathering peers we can allow picking a host that's not yet connected.
    // If we lost connection to the host or we're connected to a host and may be reelecting. Use the connected peers.
    const hostCandidates = gatheringPeersFinished ? [...network.peers] : network.peers.filter((peer) => peer.connected);
    const sortedHostCandidates = hostCandidates.sort(hostComparator);

    if (sortedHostCandidates.length === 0) {
      // This should never happen since your local client is a host candidate.
      network.hostConnectionState = HostConnectionState.Error;
      ctx.sendMessage(Thread.Main, {
        type: "host-connection-error",
        error: "Couldn't find new host.",
      });
    }

    const nextHost = sortedHostCandidates[0];

    if (!network.currentHost || nextHost.peerId !== network.currentHost.peerId) {
      network.currentHost = nextHost;

      if (nextHost.connected) {
        network.hostConnectionState = HostConnectionState.Connected;
        network.hostConnectionTimeout = 0;
        ctx.sendMessage(Thread.Main, {
          type: "host-connection-successful",
        });
      } else {
        network.hostConnectionState = HostConnectionState.Connecting;
        network.hostConnectionTimeout = ctx.elapsed + HOST_CONNECTION_TIMEOUT;
        ctx.sendMessage(Thread.Main, {
          type: "host-connection-started",
        });
      }
    }
  }

  if (network.hostConnectionState === HostConnectionState.Connecting && network.currentHost) {
    if (network.currentHost.connected) {
      network.hostConnectionState = HostConnectionState.Connected;
      network.hostConnectionTimeout = 0;
      ctx.sendMessage(Thread.Main, {
        type: "host-connection-successful",
      });
    } else if (ctx.elapsed > network.hostConnectionTimeout) {
      network.hostConnectionState = HostConnectionState.Error;
      ctx.sendMessage(Thread.Main, {
        type: "host-connection-error",
        error: "Connection to host timed out.",
      });
    }
  }
}
