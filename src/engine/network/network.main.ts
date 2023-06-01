import murmurHash from "murmurhash-js";

import { InitializeNetworkStateMessage, NetworkMessageType, SetHostMessage } from "./network.common";
import { IMainThreadContext } from "../MainThread";
import { AudioModule, setPeerMediaStream } from "../audio/audio.main";
import { defineModule, getModule, Thread } from "../module/module.common";
import {
  BROADCAST_PEER_ID,
  createNetworkRingBuffer,
  dequeueNetworkRingBuffer,
  NetworkRingBuffer,
} from "./NetworkRingBuffer";
import { readArrayBuffer, readUint32, readUint8 } from "../allocator/CursorView";

/*********
 * Types *
 ********/

export interface MainNetworkState {
  reliableChannels: Map<number, RTCDataChannel>;
  unreliableChannels: Map<number, RTCDataChannel>;
  ws?: WebSocket;
  incomingMessageHandlers: Map<number, ({ data }: { data: ArrayBuffer }) => void>;
  incomingRingBuffer: NetworkRingBuffer;
  outgoingRingBuffer: NetworkRingBuffer;
  peerId?: number;
  hostId?: number;
  peerKeyToId: Map<string, number>;
  peerIdToKey: Map<number, string>;
}

/******************
 * Initialization *
 *****************/

export const NetworkModule = defineModule<IMainThreadContext, MainNetworkState>({
  name: "network",
  async create(ctx, { sendMessage }) {
    const incomingRingBuffer = createNetworkRingBuffer();
    const outgoingRingBuffer = createNetworkRingBuffer();

    sendMessage<InitializeNetworkStateMessage>(Thread.Game, NetworkMessageType.InitializeNetworkState, {
      type: NetworkMessageType.InitializeNetworkState,
      incomingRingBuffer,
      outgoingRingBuffer,
    });

    return {
      incomingRingBuffer,
      outgoingRingBuffer,
      peerKeyToId: new Map(),
      peerIdToKey: new Map(),
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

const onIncomingMessage =
  (ctx: IMainThreadContext, network: MainNetworkState, peerId: number) =>
  ({ data }: { data: ArrayBuffer }) => {
    enqueueNetworkRingBuffer(network.incomingRingBuffer, peerId, data);
  };

function onPeerLeft(mainThread: IMainThreadContext, peerId: number) {
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
  ctx.sendMessage(Thread.Game, {
    type: NetworkMessageType.Reconnect,
  });
}

export function setHost(mainThread: IMainThreadContext, hostKey: string) {
  const network = getModule(mainThread, NetworkModule);
  const hostPeerId = network.peerKeyToId.get(hostKey);

  if (!hostPeerId) {
    throw new Error(`Host key ${hostKey} not found`);
    return;
  }

  mainThread.sendMessage<SetHostMessage>(Thread.Game, {
    type: NetworkMessageType.SetHost,
    hostPeerId,
  });
}

export function hasPeer(mainThread: IMainThreadContext, peerKey: string): boolean {
  const network = getModule(mainThread, NetworkModule);
  return network.peerKeyToId.has(peerKey);
}

export function addPeer(
  mainThread: IMainThreadContext,
  peerKey: string,
  dataChannel: RTCDataChannel,
  mediaStream?: MediaStream
) {
  const network = getModule(mainThread, NetworkModule);
  const audio = getModule(mainThread, AudioModule);
  const peerId = murmurHash(peerKey) >>> 16;
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

export function removePeer(mainThread: IMainThreadContext, peerId: number) {
  onPeerLeft(mainThread, peerId);
}

export function toggleMutePeer(mainThread: IMainThreadContext, peerId: number) {
  const audio = getModule(mainThread, AudioModule);
  const mediaStream = audio.mediaStreams.get(peerId);
  if (mediaStream) {
    const tracks = mediaStream.getAudioTracks();
    if (tracks[0].enabled) tracks.forEach((t) => (t.enabled = false));
    else tracks.forEach((t) => (t.enabled = true));
  }
}

export function isPeerMuted(mainThread: IMainThreadContext, peerKey: number) {
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

export function MainThreadNetworkSystem(ctx: IMainThreadContext) {
  const network = getModule(ctx, NetworkModule);

  const outgoingRingBuffer = network.outgoingRingBuffer;
  const cursorView = outgoingRingBuffer.cursorView;

  while (dequeueNetworkRingBuffer(outgoingRingBuffer)) {
    const reliable = readUint8(cursorView) !== 0;
    const to = readUint32(cursorView);
    const broadcast = to === BROADCAST_PEER_ID;
    const byteLength = readUint32(cursorView);
    const data = readArrayBuffer(cursorView, byteLength);
    const channels = reliable ? network.reliableChannels : network.unreliableChannels;

    if (broadcast) {
      channels.forEach((peer) => {
        if (peer.readyState !== "open") {
          console.error("peer's reliable channel is not open");
          return;
        }

        peer.send(data);
      });
    } else {
      const peer = channels.get(to);
      if (!peer) {
        console.error(`Failed to send message, peer: ${to}'s channel not found`);
        continue;
      }

      peer.send(data);
    }
  }
}
