import { NetworkBroadcast, NetworkMessage, NetworkMessageType } from "./network.common";
import { IMainThreadContext } from "../MainThread";
import { AudioModule, setPeerMediaStream } from "../audio/audio.main";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";

/*********
 * Types *
 ********/

export interface NetworkModuleState {
  reliableChannels: Map<string, RTCDataChannel>;
  unreliableChannels: Map<string, RTCDataChannel>;
  ws?: WebSocket;
  // event listener references here for access upon disposal (removeEventListener)
  onPeerMessage?: ({ data }: { data: ArrayBuffer }) => void;
}

/******************
 * Initialization *
 *****************/

export const NetworkModule = defineModule<IMainThreadContext, NetworkModuleState>({
  name: "network",
  create() {
    return {
      reliableChannels: new Map<string, RTCDataChannel>(),
      unreliableChannels: new Map<string, RTCDataChannel>(),
    };
  },
  init(ctx) {
    const disposables = [
      registerMessageHandler(ctx, NetworkMessageType.NetworkMessage, onNetworkMessage),
      registerMessageHandler(ctx, NetworkMessageType.NetworkBroadcast, onNetworkBroadcast),
    ];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

/********************
 * Message Handlers *
 *******************/

const onPeerMessage =
  (ctx: IMainThreadContext, peerId: string) =>
  ({ data }: { data: ArrayBuffer }) => {
    ctx.sendMessage(Thread.Game, { type: NetworkMessageType.NetworkMessage, peerId, packet: data }, [data]);
  };

const onNetworkMessage = (mainThread: IMainThreadContext, message: NetworkMessage) => {
  const network = getModule(mainThread, NetworkModule);
  const { ws, reliableChannels, unreliableChannels } = network;
  const { peerId, packet, reliable } = message;
  if (ws) {
    ws.send(packet);
  } else {
    const channels = reliable ? reliableChannels : unreliableChannels;
    const peer = channels.get(peerId);
    if (peer) peer.send(packet);
  }
};

const onNetworkBroadcast = (mainThread: IMainThreadContext, message: NetworkBroadcast) => {
  const network = getModule(mainThread, NetworkModule);
  const { ws, reliableChannels, unreliableChannels } = network;
  const { packet, reliable } = message;
  if (ws) {
    ws.send(packet);
  } else {
    const channels = reliable ? reliableChannels : unreliableChannels;
    channels.forEach((peer) => {
      if (peer.readyState === "open") {
        peer.send(packet);
      }
    });
  }
};

function onPeerLeft(mainThread: IMainThreadContext, peerId: string) {
  const network = getModule(mainThread, NetworkModule);
  const { reliableChannels, unreliableChannels } = network;
  const reliableChannel = reliableChannels.get(peerId);
  const unreliableChannel = unreliableChannels.get(peerId);
  if (network.onPeerMessage) {
    reliableChannel?.removeEventListener("message", network.onPeerMessage);
    unreliableChannel?.removeEventListener("message", network.onPeerMessage);
  }

  reliableChannels.delete(peerId);
  unreliableChannels.delete(peerId);

  mainThread.sendMessage(Thread.Game, {
    type: NetworkMessageType.RemovePeerId,
    peerId,
  });
}

/*******
 * API *
 ******/

export function connectToTestNet(mainThread: IMainThreadContext) {
  const network = getModule(mainThread, NetworkModule);

  network.ws = new WebSocket("ws://localhost:9090");
  const { ws } = network;

  ws.binaryType = "arraybuffer";

  ws.addEventListener("open", () => {
    console.log("connected to websocket server");
  });

  ws.addEventListener("close", () => {});

  const setHostFn = (data: { data: any }) => {
    if (data.data === "setHost") {
      console.log("ws - setHost");
      mainThread.sendMessage(Thread.Game, {
        type: NetworkMessageType.SetHost,
        value: true,
      });
      ws?.removeEventListener("message", setHostFn);
    }
  };
  ws.addEventListener("message", setHostFn);

  const setPeerIdFn = (data: { data: any }) => {
    try {
      const d: any = JSON.parse(data.data);
      if (d.setPeerId) {
        console.log("ws - setPeerId", d.setPeerId);
        mainThread.sendMessage(Thread.Game, {
          type: NetworkMessageType.SetPeerId,
          peerId: d.setPeerId,
        });

        ws?.addEventListener("message", onPeerMessage(mainThread, d.setPeerId));

        ws?.removeEventListener("message", setPeerIdFn);
      }
    } catch {}
  };
  ws.addEventListener("message", setPeerIdFn);

  const addPeerId = (data: { data: any }) => {
    try {
      const d: any = JSON.parse(data.data);
      if (d.addPeerId) {
        console.log("ws - addPeerId", d.addPeerId);
        mainThread.sendMessage(Thread.Game, {
          type: NetworkMessageType.AddPeerId,
          peerId: d.addPeerId,
        });
      }
    } catch {}
  };
  ws.addEventListener("message", addPeerId);
}

export function setHost(mainThread: IMainThreadContext, value: boolean) {
  mainThread.sendMessage(Thread.Game, {
    type: NetworkMessageType.SetHost,
    value,
  });
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

  if (dataChannel.ordered) reliableChannels.set(peerId, dataChannel);
  else unreliableChannels.set(peerId, dataChannel);

  const onOpen = () => {
    const onClose = () => {
      onPeerLeft(mainThread, peerId);
    };

    network.onPeerMessage = onPeerMessage(mainThread, peerId);
    dataChannel.addEventListener("message", network.onPeerMessage);
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

export function setPeerId(mainThread: IMainThreadContext, peerId: string) {
  mainThread.sendMessage(Thread.Game, {
    type: NetworkMessageType.SetPeerId,
    peerId,
  });
}
