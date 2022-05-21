import {
  NetworkMessageType,
  ReliableNetworkMessage,
  UnreliableNetworkMessage,
  ReliableNetworkBroadcast,
  UnreliableNetworkBroadcast,
} from "./network.common";
import { IMainThreadContext } from "../MainThread";
import { AudioScope, setPeerMediaStream } from "../audio/audio.main";
import { getScope, registerMessageHandler } from "../types/types.common";

/*********
 * Types *
 ********/

export interface IMainNetworkScope {
  reliableChannels: Map<string, RTCDataChannel>;
  unreliableChannels: Map<string, RTCDataChannel>;
  ws?: WebSocket;
  // event listener references here for access upon disposal (removeEventListener)
  onPeerMessage?: ({ data }: { data: ArrayBuffer }) => void;
}

/******************
 * Initialization *
 *****************/

export const NetworkScope: () => IMainNetworkScope = () => ({
  reliableChannels: new Map<string, RTCDataChannel>(),
  unreliableChannels: new Map<string, RTCDataChannel>(),
});

export async function NetworkModule(ctx: IMainThreadContext) {
  // const network = getScope(ctx, NetworkScope);

  const disposables = [
    registerMessageHandler(ctx, NetworkMessageType.ReliableNetworkMessage, onReliableNetworkMessage),
    registerMessageHandler(ctx, NetworkMessageType.UnreliableNetworkMessage, onUnreliableNetworkMessage),
    registerMessageHandler(ctx, NetworkMessageType.ReliableNetworkBroadcast, onReliableNetworkBroadcast),
    registerMessageHandler(ctx, NetworkMessageType.UnreliableNetworkBroadcast, onUnreliableNetworkBroadcast),
  ];

  return () => {
    for (const dispose of disposables) {
      dispose();
    }
  };
}

/********************
 * Message Handlers *
 *******************/

const onPeerMessage =
  (gameWorker: Worker) =>
  ({ data }: { data: ArrayBuffer }) => {
    gameWorker.postMessage({ type: NetworkMessageType.ReliableNetworkMessage, packet: data }, [data]);
  };

const onReliableNetworkMessage = (mainThread: IMainThreadContext, message: ReliableNetworkMessage) => {
  const netScope = getScope(mainThread, NetworkScope);
  const { ws, reliableChannels } = netScope;
  const { peerId, packet } = message;
  if (ws) {
    ws.send(packet);
  } else {
    const peer = reliableChannels.get(peerId);
    if (peer) peer.send(packet);
  }
};

const onUnreliableNetworkMessage = (mainThread: IMainThreadContext, message: UnreliableNetworkMessage) => {
  const netScope = getScope(mainThread, NetworkScope);
  const { ws, unreliableChannels } = netScope;
  const { peerId, packet } = message;
  if (ws) {
    ws.send(packet);
  } else {
    const peer = unreliableChannels.get(peerId);
    if (peer) peer.send(packet);
  }
};

const onReliableNetworkBroadcast = (mainThread: IMainThreadContext, message: ReliableNetworkBroadcast) => {
  const netScope = getScope(mainThread, NetworkScope);
  const { ws, reliableChannels } = netScope;
  const { packet } = message;
  if (ws) {
    ws.send(packet);
  } else {
    reliableChannels.forEach((peer) => {
      if (peer.readyState === "open") {
        peer.send(packet);
      }
    });
  }
};

const onUnreliableNetworkBroadcast = (mainThread: IMainThreadContext, message: UnreliableNetworkBroadcast) => {
  const netScope = getScope(mainThread, NetworkScope);
  const { ws, unreliableChannels } = netScope;
  const { packet } = message;
  if (ws) {
    ws?.send(packet);
  } else {
    unreliableChannels.forEach((peer) => {
      if (peer.readyState === "open") {
        peer.send(packet);
      }
    });
  }
};

function onPeerLeft(mainThread: IMainThreadContext, peerId: string) {
  const { gameWorker } = mainThread;
  const netScope = getScope(mainThread, NetworkScope);
  const { reliableChannels, unreliableChannels } = netScope;
  const reliableChannel = reliableChannels.get(peerId);
  const unreliableChannel = unreliableChannels.get(peerId);
  if (netScope.onPeerMessage) {
    reliableChannel?.removeEventListener("message", netScope.onPeerMessage);
    unreliableChannel?.removeEventListener("message", netScope.onPeerMessage);
  }

  reliableChannels.delete(peerId);
  unreliableChannels.delete(peerId);

  gameWorker.postMessage({
    type: NetworkMessageType.RemovePeerId,
    peerId,
  });
}

/*******
 * API *
 ******/

export function connectToTestNet(mainThread: IMainThreadContext) {
  const netScope = getScope(mainThread, NetworkScope);
  const { gameWorker } = mainThread;

  netScope.ws = new WebSocket("ws://localhost:9090");
  const { ws } = netScope;

  ws.binaryType = "arraybuffer";

  ws.addEventListener("open", () => {
    console.log("connected to websocket server");
  });

  ws.addEventListener("close", () => {});

  const setHostFn = (data: { data: any }) => {
    if (data.data === "setHost") {
      console.log("ws - setHost");
      gameWorker.postMessage({
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
        gameWorker.postMessage({
          type: NetworkMessageType.SetPeerId,
          peerId: d.setPeerId,
        });
        gameWorker.postMessage({
          type: NetworkMessageType.StateChanged,
          state: { joined: true },
        });

        ws?.addEventListener("message", onPeerMessage(gameWorker));

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
        gameWorker.postMessage({
          type: NetworkMessageType.AddPeerId,
          peerId: d.addPeerId,
        });
      }
    } catch {}
  };
  ws.addEventListener("message", addPeerId);
}

export function setHost(mainThread: IMainThreadContext, value: boolean) {
  const { gameWorker } = mainThread;
  gameWorker.postMessage({
    type: NetworkMessageType.SetHost,
    value,
  });
}

export function setState(mainThread: IMainThreadContext, state: any) {
  const { gameWorker } = mainThread;
  gameWorker.postMessage({
    type: NetworkMessageType.StateChanged,
    state,
  });
}

export function hasPeer(mainThread: IMainThreadContext, peerId: string): boolean {
  const netScope = getScope(mainThread, NetworkScope);
  const { reliableChannels } = netScope;
  return reliableChannels.has(peerId);
}

export function addPeer(
  mainThread: IMainThreadContext,
  peerId: string,
  dataChannel: RTCDataChannel,
  mediaStream?: MediaStream
) {
  const { gameWorker } = mainThread;
  const netScope = getScope(mainThread, NetworkScope);
  const audioScope = getScope(mainThread, AudioScope);
  const { reliableChannels, unreliableChannels } = netScope;

  if (dataChannel.ordered) reliableChannels.set(peerId, dataChannel);
  else unreliableChannels.set(peerId, dataChannel);

  const onOpen = () => {
    const onClose = () => {
      onPeerLeft(mainThread, peerId);
    };

    netScope.onPeerMessage = onPeerMessage(gameWorker);
    dataChannel.addEventListener("message", netScope.onPeerMessage);
    dataChannel.addEventListener("close", onClose);

    gameWorker.postMessage({
      type: NetworkMessageType.AddPeerId,
      peerId,
    });
  };

  dataChannel.binaryType = "arraybuffer";
  dataChannel.addEventListener("open", onOpen);

  if (mediaStream) {
    setPeerMediaStream(audioScope, peerId, mediaStream);
  }
}

export function removePeer(mainThread: IMainThreadContext, peerId: string) {
  onPeerLeft(mainThread, peerId);
}

export function disconnect(mainThread: IMainThreadContext) {
  const netScope = getScope(mainThread, NetworkScope);
  const { reliableChannels } = netScope;
  for (const [peerId] of reliableChannels) {
    onPeerLeft(mainThread, peerId);
  }
}

export function setPeerId(mainThread: IMainThreadContext, peerId: string) {
  const { gameWorker } = mainThread;
  gameWorker.postMessage({
    type: NetworkMessageType.SetPeerId,
    peerId,
  });
}
