import {
  WorkerMessages,
  WorkerMessageType,
  ReliableNetworkMessage,
  UnreliableNetworkMessage,
  ReliableNetworkBroadcast,
  UnreliableNetworkBroadcast,
} from "../WorkerMessage";
import { MainThreadState } from "../MainThread";
import { setPeerMediaStream } from "../audio/audio.main";

const onPeerMessage =
  (gameWorker: Worker) =>
  ({ data }: { data: ArrayBuffer }) => {
    gameWorker.postMessage({ type: WorkerMessageType.ReliableNetworkMessage, packet: data }, [data]);
  };

export interface MainThreadNetworkState {
  ws: WebSocket | undefined;
  reliableChannels: Map<string, RTCDataChannel>;
  unreliableChannels: Map<string, RTCDataChannel>;
  onGameWorkerMessage: Function;
}

const sendReliable = (netState: MainThreadNetworkState, message: ReliableNetworkMessage) => {
  const { ws, reliableChannels } = netState;
  const { peerId, packet } = message;
  if (ws) {
    ws.send(packet);
  } else {
    const peer = reliableChannels.get(peerId);
    if (peer) peer.send(packet);
  }
};

const sendUnreliable = (netState: MainThreadNetworkState, message: UnreliableNetworkMessage) => {
  const { ws, unreliableChannels } = netState;
  const { peerId, packet } = message;
  if (ws) {
    ws.send(packet);
  } else {
    const peer = unreliableChannels.get(peerId);
    if (peer) peer.send(packet);
  }
};

const broadcastReliable = (netState: MainThreadNetworkState, message: ReliableNetworkBroadcast) => {
  const { ws, reliableChannels } = netState;
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

const broadcastUnreliable = (netState: MainThreadNetworkState, message: UnreliableNetworkBroadcast) => {
  const { ws, unreliableChannels } = netState;
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

function onPeerLeft(mainState: MainThreadState, peerId: string) {
  const {
    gameWorker,
    network: { reliableChannels, unreliableChannels },
  } = mainState;
  const reliableChannel = reliableChannels.get(peerId);
  const unreliableChannel = unreliableChannels.get(peerId);
  reliableChannel?.removeEventListener("message", onPeerMessage(gameWorker));
  unreliableChannel?.removeEventListener("message", onPeerMessage(gameWorker));

  reliableChannels.delete(peerId);
  unreliableChannels.delete(peerId);

  gameWorker.postMessage({
    type: WorkerMessageType.RemovePeerId,
    peerId,
  });
}

const onGameWorkerMessage =
  (network: MainThreadNetworkState) =>
  ({ data }: MessageEvent) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    switch (message.type) {
      case WorkerMessageType.ReliableNetworkMessage:
        sendReliable(network, message);
        break;
      case WorkerMessageType.UnreliableNetworkMessage:
        sendUnreliable(network, message);
        break;
      case WorkerMessageType.ReliableNetworkBroadcast:
        broadcastReliable(network, message);
        break;
      case WorkerMessageType.UnreliableNetworkBroadcast:
        broadcastUnreliable(network, message);
        break;
    }
  };

/***************
 * External API *
 ***************/

export const createNetworkState = () => ({
  reliableChannels: new Map(),
  unreliableChannels: new Map(),
});

export const disposeNetworkState = (mainState: MainThreadState) => {
  const { network, gameWorker } = mainState;
  gameWorker.removeEventListener("message", network.onGameWorkerMessage);
};

export const initNetworkState = (mainState: MainThreadState) => {
  bindNetworkEvents(mainState);
};

export const bindNetworkEvents = (mainState: MainThreadState) => {
  const { network, gameWorker } = mainState;
  network.onGameWorkerMessage = onGameWorkerMessage(network);
  gameWorker.addEventListener("message", network.onGameWorkerMessage);
};

export function connectToTestNet(mainState: MainThreadState) {
  const { network, gameWorker } = mainState;

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
      gameWorker.postMessage({
        type: WorkerMessageType.SetHost,
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
          type: WorkerMessageType.SetPeerId,
          peerId: d.setPeerId,
        });
        gameWorker.postMessage({
          type: WorkerMessageType.StateChanged,
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
          type: WorkerMessageType.AddPeerId,
          peerId: d.addPeerId,
        });
      }
    } catch {}
  };
  ws.addEventListener("message", addPeerId);
}

export function setHost(mainState: MainThreadState, value: boolean) {
  const { gameWorker } = mainState;
  gameWorker.postMessage({
    type: WorkerMessageType.SetHost,
    value,
  });
}

export function setState(mainState: MainThreadState, state: any) {
  const { gameWorker } = mainState;
  gameWorker.postMessage({
    type: WorkerMessageType.StateChanged,
    state,
  });
}

export function hasPeer(mainState: MainThreadState, peerId: string): boolean {
  const { reliableChannels } = mainState.network;
  return reliableChannels.has(peerId);
}

export function addPeer(
  mainState: MainThreadState,
  peerId: string,
  dataChannel: RTCDataChannel,
  mediaStream?: MediaStream
) {
  const {
    gameWorker,
    network: { reliableChannels, unreliableChannels },
  } = mainState;

  if (dataChannel.ordered) reliableChannels.set(peerId, dataChannel);
  else unreliableChannels.set(peerId, dataChannel);

  const onOpen = () => {
    const onClose = () => {
      onPeerLeft(mainState, peerId);
    };

    dataChannel.addEventListener("message", onPeerMessage(gameWorker));
    dataChannel.addEventListener("close", onClose);

    gameWorker.postMessage({
      type: WorkerMessageType.AddPeerId,
      peerId,
    });
  };

  dataChannel.binaryType = "arraybuffer";
  dataChannel.addEventListener("open", onOpen);

  if (mediaStream) {
    setPeerMediaStream(mainState.audio, peerId, mediaStream);
  }
}

export function removePeer(mainState: MainThreadState, peerId: string) {
  onPeerLeft(mainState, peerId);
}

export function disconnect(mainState: MainThreadState) {
  const {
    network: { reliableChannels },
  } = mainState;
  for (const [peerId] of reliableChannels) {
    onPeerLeft(mainState, peerId);
  }
}

export function setPeerId(mainState: MainThreadState, peerId: string) {
  const { gameWorker } = mainState;
  gameWorker.postMessage({
    type: WorkerMessageType.SetPeerId,
    peerId,
  });
}

export default {
  create: createNetworkState,
  init: initNetworkState,
  dispose: disposeNetworkState,
};
