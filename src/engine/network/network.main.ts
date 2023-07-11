import { availableRead } from "@thirdroom/ringbuffer";

import { InitializeNetworkStateMessage, NetworkMessageType, SetHostMessage } from "./network.common";
import { MainContext } from "../MainThread";
import { AudioModule, setPeerMediaStream } from "../audio/audio.main";
import { defineModule, getModule, Thread } from "../module/module.common";
import {
  createNetworkRingBuffer,
  dequeueNetworkRingBuffer,
  enqueueNetworkRingBuffer,
  NetworkRingBuffer,
} from "./NetworkRingBuffer";
import { createCursorView, readUint8 } from "../allocator/CursorView";
import { UnreliableNetworkActions } from "./NetworkMessage";

/*********
 * Types *
 ********/

export interface MainNetworkState {
  reliableChannels: Map<string, RTCDataChannel>;
  unreliableChannels: Map<string, RTCDataChannel>;
  ws?: WebSocket;
  incomingMessageHandlers: Map<string, ({ data }: { data: ArrayBuffer }) => void>;
  incomingReliableRingBuffer: NetworkRingBuffer;
  incomingUnreliableRingBuffer: NetworkRingBuffer;
  outgoingReliableRingBuffer: NetworkRingBuffer;
  outgoingUnreliableRingBuffer: NetworkRingBuffer;
  peerKey?: string;
  hostKey?: string;
}

/******************
 * Initialization *
 *****************/

export const NetworkModule = defineModule<MainContext, MainNetworkState>({
  name: "network",
  async create(ctx, { sendMessage }) {
    const incomingReliableRingBuffer = createNetworkRingBuffer();
    const incomingUnreliableRingBuffer = createNetworkRingBuffer();
    const outgoingReliableRingBuffer = createNetworkRingBuffer();
    const outgoingUnreliableRingBuffer = createNetworkRingBuffer();

    sendMessage<InitializeNetworkStateMessage>(Thread.Game, NetworkMessageType.InitializeNetworkState, {
      type: NetworkMessageType.InitializeNetworkState,
      incomingReliableRingBuffer,
      incomingUnreliableRingBuffer,
      outgoingReliableRingBuffer,
      outgoingUnreliableRingBuffer,
    });

    return {
      incomingReliableRingBuffer,
      incomingUnreliableRingBuffer,
      outgoingReliableRingBuffer,
      outgoingUnreliableRingBuffer,
      reliableChannels: new Map(),
      unreliableChannels: new Map(),
      incomingMessageHandlers: new Map(),
    };
  },
  init(ctx) {},
});

/********************
 * Message Handlers *
 *******************/

function isPacketReliable(data: ArrayBuffer): boolean {
  const v = createCursorView(data);
  const msgType = readUint8(v);
  return !UnreliableNetworkActions.includes(msgType);
}

const onIncomingMessage =
  (ctx: MainContext, network: MainNetworkState, peerId: string) =>
  ({ data }: { data: ArrayBuffer }) => {
    const isReliable = isPacketReliable(data);
    if (isReliable) {
      if (!enqueueNetworkRingBuffer(network.incomingReliableRingBuffer, peerId, data)) {
        // TODO: add a backing buffer in case this fills
        throw new Error("incoming reliable network ring buffer full");
      }
    } else {
      enqueueNetworkRingBuffer(network.incomingUnreliableRingBuffer, peerId, data);
    }
  };

function onPeerLeft(ctx: MainContext, peerId: string) {
  const network = getModule(ctx, NetworkModule);
  const { reliableChannels, unreliableChannels } = network;
  const reliableChannel = reliableChannels.get(peerId);
  const unreliableChannel = unreliableChannels.get(peerId);

  const handler = network.incomingMessageHandlers.get(peerId);
  if (handler) {
    reliableChannel?.removeEventListener("message", handler);
    unreliableChannel?.removeEventListener("message", handler);
    network.incomingMessageHandlers.delete(peerId);
  }

  reliableChannels.delete(peerId);
  unreliableChannels.delete(peerId);

  const audio = getModule(ctx, AudioModule);
  setPeerMediaStream(audio, peerId, undefined);

  ctx.sendMessage(Thread.Game, {
    type: NetworkMessageType.RemovePeerId,
    peerId,
  });
}

/*******
 * API *
 ******/

export function setHost(ctx: MainContext, hostKey: string) {
  const network = getModule(ctx, NetworkModule);
  const hostChanged = network.hostKey !== hostKey;

  if (hostChanged) {
    console.info("electing new host", hostKey);
    network.hostKey = hostKey;
    ctx.sendMessage<SetHostMessage>(Thread.Game, {
      type: NetworkMessageType.SetHost,
      hostId: hostKey,
    });
  }
}

export function hasPeer(ctx: MainContext, peerId: string): boolean {
  const network = getModule(ctx, NetworkModule);
  const { reliableChannels } = network;
  return reliableChannels.has(peerId);
}

export function addPeer(ctx: MainContext, peerKey: string, dataChannel: RTCDataChannel, mediaStream?: MediaStream) {
  const network = getModule(ctx, NetworkModule);
  const audio = getModule(ctx, AudioModule);
  const { reliableChannels, unreliableChannels } = network;

  if (reliableChannels.has(peerKey)) {
    console.warn("peer already added", peerKey);
    return;
  }

  if (dataChannel.ordered) reliableChannels.set(peerKey, dataChannel);
  else unreliableChannels.set(peerKey, dataChannel);

  const onOpen = () => {
    const onClose = () => {
      onPeerLeft(ctx, peerKey);
    };

    const handler = onIncomingMessage(ctx, network, peerKey);
    network.incomingMessageHandlers.set(peerKey, handler);
    dataChannel.addEventListener("message", handler);
    dataChannel.addEventListener("close", onClose);

    network.peerKey = peerKey;

    ctx.sendMessage(Thread.Game, {
      type: NetworkMessageType.AddPeerId,
      peerId: peerKey,
    });
  };

  dataChannel.binaryType = "arraybuffer";

  if (dataChannel.readyState === "open") {
    onOpen();
  } else {
    dataChannel.addEventListener("open", onOpen);
  }

  if (mediaStream) {
    setPeerMediaStream(audio, peerKey, mediaStream);
  }
}

export function removePeer(ctx: MainContext, peerKey: string) {
  onPeerLeft(ctx, peerKey);
}

export function toggleMutePeer(ctx: MainContext, peerKey: string) {
  const audio = getModule(ctx, AudioModule);
  const mediaStream = audio.mediaStreams.get(peerKey);
  if (mediaStream) {
    const tracks = mediaStream.getAudioTracks();
    if (tracks[0].enabled) tracks.forEach((t) => (t.enabled = false));
    else tracks.forEach((t) => (t.enabled = true));
  }
}

export function isPeerMuted(ctx: MainContext, peerId: string) {
  const audio = getModule(ctx, AudioModule);
  const mediaStream = audio.mediaStreams.get(peerId);
  if (mediaStream) {
    const tracks = mediaStream.getAudioTracks();
    return !tracks[0].enabled;
  }
}

export function disconnect(ctx: MainContext) {
  const network = getModule(ctx, NetworkModule);
  const { reliableChannels } = network;
  for (const [peerId] of reliableChannels) {
    onPeerLeft(ctx, peerId);
  }
}

const ringOut = { packet: new ArrayBuffer(0), peerKey: "", broadcast: false };
export function MainThreadNetworkSystem(ctx: MainContext) {
  const network = getModule(ctx, NetworkModule);

  while (availableRead(network.outgoingReliableRingBuffer)) {
    dequeueNetworkRingBuffer(network.outgoingReliableRingBuffer, ringOut);
    if (ringOut.broadcast) {
      network.reliableChannels.forEach((peer) => {
        if (peer.readyState !== "open") {
          console.error("peer's reliable channel is not open");
          return;
        }

        peer.send(ringOut.packet);
      });
    } else {
      const peer = network.reliableChannels.get(ringOut.peerKey);
      if (!peer) {
        console.error("Failed to send message, peer's reliable channel not found", ringOut.peerKey);
        continue;
      }

      peer.send(ringOut.packet);
    }
  }

  while (availableRead(network.outgoingUnreliableRingBuffer)) {
    dequeueNetworkRingBuffer(network.outgoingUnreliableRingBuffer, ringOut);
    // TODO: add unreliable channels
    if (ringOut.broadcast) {
      network.reliableChannels.forEach((peer) => {
        if (peer.readyState !== "open") {
          console.error("peer's unreliable channel is not open");
          return;
        }

        peer.send(ringOut.packet);
      });
    } else {
      const peer = network.reliableChannels.get(ringOut.peerKey);
      if (!peer) {
        console.error("peer's unreliable channel is not found", ringOut.peerKey);
        continue;
      }

      peer.send(ringOut.packet);
    }
  }
}
