import { availableRead } from "@thirdroom/ringbuffer";

import { InitializeNetworkStateMessage, NetworkMessageType, SetHostMessage } from "./network.common";
import { IMainThreadContext } from "../MainThread";
import { AudioModule, setPeerMediaStream } from "../audio/audio.main";
import { defineModule, getModule, Thread } from "../module/module.common";
import {
  createNetworkRingBuffer,
  dequeueNetworkRingBuffer,
  enqueueNetworkRingBuffer,
  NetworkRingBuffer,
} from "./RingBuffer";
import { createCursorView, readUint8 } from "../allocator/CursorView";
import { UnreliableNetworkActions } from "./NetworkAction";

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
  peerId?: string;
  hostId?: string;
}

/******************
 * Initialization *
 *****************/

export const NetworkModule = defineModule<IMainThreadContext, MainNetworkState>({
  name: "network",
  async create(ctx, { sendMessage }) {
    const incomingReliableRingBuffer = createNetworkRingBuffer();
    const incomingUnreliableRingBuffer = createNetworkRingBuffer();
    const outgoingReliableRingBuffer = createNetworkRingBuffer();
    const outgoingUnreliableRingBuffer = createNetworkRingBuffer();

    const authoritative = localStorage.getItem("authoritativeNetworking") === "true";

    sendMessage<InitializeNetworkStateMessage>(Thread.Game, NetworkMessageType.InitializeNetworkState, {
      type: NetworkMessageType.InitializeNetworkState,
      incomingReliableRingBuffer,
      incomingUnreliableRingBuffer,
      outgoingReliableRingBuffer,
      outgoingUnreliableRingBuffer,
      authoritative,
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
  (ctx: IMainThreadContext, network: MainNetworkState, peerId: string) =>
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

function onPeerLeft(mainThread: IMainThreadContext, peerId: string) {
  const network = getModule(mainThread, NetworkModule);
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

  const audio = getModule(mainThread, AudioModule);
  setPeerMediaStream(audio, peerId, undefined);

  mainThread.sendMessage(Thread.Game, {
    type: NetworkMessageType.RemovePeerId,
    peerId,
  });
}

/*******
 * API *
 ******/

export function reconnectPeers(ctx: IMainThreadContext) {
  const network = getModule(ctx, NetworkModule);
  const { reliableChannels } = network;
  for (const [peerId] of reliableChannels) {
    ctx.sendMessage(Thread.Game, {
      type: NetworkMessageType.RemovePeerId,
      peerId,
    });
    ctx.sendMessage(Thread.Game, {
      type: NetworkMessageType.AddPeerId,
      peerId,
    });
  }
}

export function setHost(mainThread: IMainThreadContext, hostId: string) {
  const network = getModule(mainThread, NetworkModule);
  const hostChanged = network.hostId !== hostId;

  if (hostChanged) {
    console.info("electing new host", hostId);
    network.hostId = hostId;
    mainThread.sendMessage<SetHostMessage>(Thread.Game, {
      type: NetworkMessageType.SetHost,
      hostId,
    });
  }
}

export function hasPeer(mainThread: IMainThreadContext, peerId: string): boolean {
  const network = getModule(mainThread, NetworkModule);
  const { reliableChannels } = network;
  return reliableChannels.has(peerId);
}

export function addPeer(
  mainThread: IMainThreadContext,
  peerId: string,
  dataChannel: RTCDataChannel,
  mediaStream?: MediaStream
) {
  const network = getModule(mainThread, NetworkModule);
  const audio = getModule(mainThread, AudioModule);
  const { reliableChannels, unreliableChannels } = network;

  if (reliableChannels.has(peerId)) {
    console.warn("peer already added", peerId);
    return;
  }

  if (dataChannel.ordered) reliableChannels.set(peerId, dataChannel);
  else unreliableChannels.set(peerId, dataChannel);

  const onOpen = () => {
    const onClose = () => {
      onPeerLeft(mainThread, peerId);
    };

    const handler = onIncomingMessage(mainThread, network, peerId);
    network.incomingMessageHandlers.set(peerId, handler);
    dataChannel.addEventListener("message", handler);
    dataChannel.addEventListener("close", onClose);

    mainThread.sendMessage(Thread.Game, {
      type: NetworkMessageType.AddPeerId,
      peerId,
    });
  };

  dataChannel.binaryType = "arraybuffer";

  if (dataChannel.readyState === "open") {
    onOpen();
  } else {
    dataChannel.addEventListener("open", onOpen);
  }

  if (mediaStream) {
    setPeerMediaStream(audio, peerId, mediaStream);
  }
}

export function removePeer(mainThread: IMainThreadContext, peerId: string) {
  onPeerLeft(mainThread, peerId);
}

export function toggleMutePeer(mainThread: IMainThreadContext, peerId: string) {
  const audio = getModule(mainThread, AudioModule);
  const mediaStream = audio.mediaStreams.get(peerId);
  if (mediaStream) {
    const tracks = mediaStream.getAudioTracks();
    if (tracks[0].enabled) tracks.forEach((t) => (t.enabled = false));
    else tracks.forEach((t) => (t.enabled = true));
  }
}

export function isPeerMuted(mainThread: IMainThreadContext, peerId: string) {
  const audio = getModule(mainThread, AudioModule);
  const mediaStream = audio.mediaStreams.get(peerId);
  if (mediaStream) {
    const tracks = mediaStream.getAudioTracks();
    return !tracks[0].enabled;
  }
}

export function disconnect(mainThread: IMainThreadContext) {
  const network = getModule(mainThread, NetworkModule);
  const { reliableChannels } = network;
  for (const [peerId] of reliableChannels) {
    onPeerLeft(mainThread, peerId);
  }
}

const ringOut = { packet: new ArrayBuffer(0), peerId: "", broadcast: false };
export function MainThreadNetworkSystem(ctx: IMainThreadContext) {
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
      const peer = network.reliableChannels.get(ringOut.peerId);
      if (!peer) {
        console.error("Failed to send message, peer's reliable channel not found", ringOut.peerId);
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
      const peer = network.reliableChannels.get(ringOut.peerId);
      if (!peer) {
        console.error("peer's unreliable channel is not found", ringOut.peerId);
        continue;
      }

      peer.send(ringOut.packet);
    }
  }
}
