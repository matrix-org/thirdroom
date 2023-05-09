import {
  createCursorView,
  moveCursorView,
  readArrayBuffer,
  sliceCursorView,
  writeArrayBuffer as cursorWriteArrayBuffer,
  writeInt32,
} from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { GameNetworkState, NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { broadcastReliable, sendReliable, sendUnreliable } from "./outbound.game";
import { NetPipeData, writeMetadata } from "./serialization.game";
import { writeUint32, readUint32 } from "../allocator/CursorView";
import { registerInboundMessageHandler } from "./inbound.game";
import {
  readUint8Array,
  WASMModuleContext,
  writeArrayBuffer,
  writeFloat32Array,
  writeString,
} from "../scripting/WASMModuleContext";
import { RemoteNode } from "../resource/RemoteResources";
import { getRemoteResource } from "../resource/resource.game";
import { createDisposables } from "../utils/createDisposables";
import { NetworkMessageType, PeerEnteredMessage, PeerExitedMessage } from "./network.common";
import { ScriptComponent, scriptQuery } from "../scripting/scripting.game";

interface NetworkListener {
  id: number;
  inbound: [string, ArrayBuffer, boolean][];
}

interface WebSGNetworkModuleState {
  listeners: NetworkListener[];
  nextNetworkListenerId: number;
}

export const WebSGNetworkModule = defineModule<GameState, WebSGNetworkModuleState>({
  name: "WebSGNetwork",
  create: () => {
    return {
      nextNetworkListenerId: 1,
      listeners: [],
    };
  },
  init(ctx: GameState) {
    const network = getModule(ctx, NetworkModule);
    registerInboundMessageHandler(network, NetworkAction.BinaryScriptMessage, (data) =>
      deserializeScriptMessage(data, true)
    );
    registerInboundMessageHandler(network, NetworkAction.StringScriptMessage, (data) =>
      deserializeScriptMessage(data, false)
    );

    return createDisposables([
      registerMessageHandler(ctx, NetworkMessageType.PeerEntered, onPeerEntered),
      registerMessageHandler(ctx, NetworkMessageType.PeerExited, onPeerExited),
    ]);
  },
});

function onPeerEntered(ctx: GameState, msg: PeerEnteredMessage) {
  const entities = scriptQuery(ctx.world);

  for (const eid of entities) {
    const script = ScriptComponent.get(eid);
    script?.peerEntered(msg.peerIndex);
  }
}

function onPeerExited(ctx: GameState, msg: PeerExitedMessage) {
  const entities = scriptQuery(ctx.world);

  for (const eid of entities) {
    const script = ScriptComponent.get(eid);
    script?.peerExited(msg.peerIndex);
  }
}

export function createWebSGNetworkModule(ctx: GameState, wasmCtx: WASMModuleContext) {
  const network = getModule(ctx, NetworkModule);
  const websgNetwork = getModule(ctx, WebSGNetworkModule);

  return {
    network_get_host_peer_index() {
      const peerIndex = network.peerIdToIndex.get(network.hostId);

      if (peerIndex === undefined) {
        return 0;
      }

      return peerIndex;
    },
    network_get_local_peer_index() {
      const peerIndex = network.peerIdToIndex.get(network.peerId);

      if (peerIndex === undefined) {
        return 0;
      }

      return peerIndex;
    },
    network_broadcast: (packetPtr: number, byteLength: number, binary: number, reliable: number) => {
      try {
        const scriptPacket = readUint8Array(wasmCtx, packetPtr, byteLength);

        const msg = createScriptMessage(ctx, scriptPacket, !!binary);

        if (reliable) {
          broadcastReliable(ctx, network, msg);
          return 0;
        } else {
          console.error("WebSGNetworking: Unreliable broadcast currently not supported.");
          return -1;
        }
      } catch (error) {
        console.error("WebSGNetworking: Error broadcasting packet:", error);
        return -1;
      }
    },
    network_listen() {
      const id = websgNetwork.nextNetworkListenerId++;

      websgNetwork.listeners.push({
        id,
        inbound: [],
      });

      return id;
    },
    network_listener_close(listenerId: number) {
      const index = websgNetwork.listeners.findIndex((l) => l.id === listenerId);

      if (index === -1) {
        console.error(`WebSGNetworking: Listener ${listenerId} does not exist.`);
        return -1;
      }

      websgNetwork.listeners.splice(index, 1);

      return 0;
    },
    network_listener_get_message_info(listenerId: number, infoPtr: number) {
      const listener = websgNetwork.listeners.find((l) => l.id === listenerId);

      if (!listener) {
        moveCursorView(wasmCtx.cursorView, infoPtr);
        writeUint32(wasmCtx.cursorView, 0);
        writeUint32(wasmCtx.cursorView, 0);
        writeInt32(wasmCtx.cursorView, 0);
        console.error(`WebSGNetworking: Listener ${listenerId} does not exist.`);
        return -1;
      }

      let message: [string, ArrayBuffer, boolean] | undefined;
      let peerIndex: number | undefined;

      while (listener.inbound.length > 0) {
        message = listener.inbound[0];
        const peerId = message[0];
        peerIndex = network.peerIdToIndex.get(peerId);

        if (peerIndex === undefined) {
          // This message is from a peer that no longer exists.
          console.warn("Discarded message from peer that no longer exists");
          listener.inbound.shift();
          message = undefined;
        } else {
          break;
        }
      }

      moveCursorView(wasmCtx.cursorView, infoPtr);
      writeUint32(wasmCtx.cursorView, peerIndex || 0);
      writeUint32(wasmCtx.cursorView, message ? message[1].byteLength : 0);
      writeInt32(wasmCtx.cursorView, message ? (message[2] ? 1 : 0) : 0);

      return listener.inbound.length;
    },
    network_listener_receive: (listenerId: number, packetPtr: number, maxBufLength: number) => {
      try {
        const listener = websgNetwork.listeners.find((l) => l.id === listenerId);

        if (!listener) {
          console.error(`WebSGNetworking: Listener ${listenerId} does not exist or has been closed.`);
          return -1;
        }

        let message: [string, ArrayBuffer, boolean] | undefined;

        while (listener.inbound.length > 0) {
          message = listener.inbound.shift();

          if (!message) {
            break;
          }

          const peerId = message[0];
          const peerIndex = network.peerIdToIndex.get(peerId);

          if (peerIndex === undefined) {
            console.warn("Discarded message from peer that no longer exists");
            // This message is from a peer that no longer exists.
            message = undefined;
          } else {
            break;
          }
        }

        if (!message) {
          return 0;
        }

        const buffer = message[1];

        if (buffer.byteLength > maxBufLength) {
          console.error("Failed to receive script packet, packet length exceeded buffer length");
          return -1;
        }

        return writeArrayBuffer(wasmCtx, packetPtr, buffer);
      } catch (e) {
        console.error("Error writing packet to write buffer:", e);
        return -1;
      }
    },
    peer_get_id_length(peerIndex: number) {
      const peerId = network.indexToPeerId.get(peerIndex);

      if (!peerId) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      return peerId.length;
    },
    peer_get_id(peerIndex: number, idPtr: number, maxBufLength: number) {
      const peerId = network.indexToPeerId.get(peerIndex);

      if (!peerId) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      try {
        return writeString(wasmCtx, idPtr, peerId, maxBufLength);
      } catch (error) {
        console.error(error);
        return -1;
      }
    },
    peer_get_translation_element(peerIndex: number, index: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      return node.position[index];
    },
    peer_get_translation(peerIndex: number, translationPtr: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      writeFloat32Array(wasmCtx, translationPtr, node.position);

      return 0;
    },
    peer_get_rotation_element(peerIndex: number, index: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      return node.quaternion[index];
    },
    peer_get_rotation(peerIndex: number, rotationPtr: number) {
      const node = getPeerNode(ctx, network, peerIndex);

      if (!node) {
        console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
        return -1;
      }

      writeFloat32Array(wasmCtx, rotationPtr, node.quaternion);

      return 0;
    },
    peer_is_host(peerIndex: number) {
      const peerId = network.indexToPeerId.get(peerIndex);

      if (!peerId) {
        console.error(`WebSGNetworking: Peer index ${peerIndex} does not exist.`);
        return -1;
      }

      return network.hostId === peerId ? 1 : 0;
    },
    peer_is_local(peerIndex: number) {
      const peerId = network.indexToPeerId.get(peerIndex);

      if (!peerId) {
        console.error(`WebSGNetworking: Peer index ${peerIndex} does not exist.`);
        return -1;
      }

      return network.peerId === peerId ? 1 : 0;
    },
    peer_send: (peerIndex: number, packetPtr: number, byteLength: number, binary: number, reliable: number) => {
      try {
        const peerId = network.indexToPeerId.get(peerIndex);

        if (!peerId) {
          console.error(`WebSGNetworking: Peer ${peerIndex} does not exist.`);
          return -1;
        }

        const scriptPacket = readUint8Array(wasmCtx, packetPtr, byteLength);

        const msg = createScriptMessage(ctx, scriptPacket, !!binary);

        if (reliable) {
          sendReliable(ctx, network, peerId, msg);
          return 0;
        } else {
          sendUnreliable(ctx, network, peerId, msg);
        }
      } catch (error) {
        console.error("WebSGNetworking: Error broadcasting packet:", error);
        return -1;
      }
    },
  };
}

export function disposeWebSGNetworkModule(ctx: GameState) {
  const websgNetwork = getModule(ctx, WebSGNetworkModule);
  websgNetwork.listeners.length = 0;
  websgNetwork.nextNetworkListenerId = 1;
}

const messageView = createCursorView(new ArrayBuffer(10000));

function createScriptMessage(ctx: GameState, packet: ArrayBuffer, binary: boolean) {
  const data: NetPipeData = [ctx, messageView, ""];
  writeMetadata(binary ? NetworkAction.BinaryScriptMessage : NetworkAction.StringScriptMessage)(data);
  serializeScriptMessage(data, packet);
  return sliceCursorView(messageView);
}

function serializeScriptMessage(data: NetPipeData, packet: ArrayBuffer) {
  const [, v] = data;
  writeUint32(v, packet.byteLength);
  cursorWriteArrayBuffer(v, packet);
  return data;
}

function deserializeScriptMessage(data: NetPipeData, binary: boolean) {
  const [ctx, v, peerId] = data;
  const webSgNet = getModule(ctx, WebSGNetworkModule);

  if (webSgNet.listeners.length === 0) {
    return;
  }

  const len = readUint32(v);
  const packet = readArrayBuffer(v, len);

  const message: [string, ArrayBuffer, boolean] = [peerId, packet, binary];

  for (let i = 0; i < webSgNet.listeners.length; i++) {
    const listener = webSgNet.listeners[i];
    listener.inbound.push(message);
  }
}

function getPeerNode(ctx: GameState, network: GameNetworkState, peerIndex: number) {
  const peerId = network.indexToPeerId.get(peerIndex);

  if (!peerId) {
    return undefined;
  }

  const eid = network.peerIdToEntityId.get(peerId);

  if (!eid) {
    return undefined;
  }

  return getRemoteResource<RemoteNode>(ctx, eid);
}
