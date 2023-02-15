import {
  createCursorView,
  readArrayBuffer,
  sliceCursorView,
  writeArrayBuffer as cursorWriteArrayBuffer,
} from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";
import { NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { broadcastReliable } from "./outbound.game";
import { NetPipeData, writeMetadata } from "./serialization.game";
import { writeUint32, readUint32 } from "../allocator/CursorView";
import { registerInboundMessageHandler } from "./inbound.game";
import { readUint8Array, WASMModuleContext, writeArrayBuffer } from "../scripting/WASMModuleContext";

interface WebSGNetworkModuleState {
  listening: boolean;
  inbound: ArrayBuffer[];
}

export const WebSGNetworkModule = defineModule<GameState, WebSGNetworkModuleState>({
  name: "WebSGNetwork",
  create: () => {
    return {
      listening: false,
      inbound: [],
    };
  },
  init(ctx: GameState) {
    const network = getModule(ctx, NetworkModule);
    const websgNetwork = getModule(ctx, WebSGNetworkModule);
    registerInboundMessageHandler(network, NetworkAction.ScriptMessage, (data) => {
      if (websgNetwork.listening) {
        deserializeScriptMessage(data);
      }
    });
  },
});

export function createWebSGNetworkModule(ctx: GameState, wasmCtx: WASMModuleContext) {
  const network = getModule(ctx, NetworkModule);
  const websgNetwork = getModule(ctx, WebSGNetworkModule);

  return {
    listen() {
      if (websgNetwork.listening) {
        console.error("WebSGNetworking: Cannot listen for events, already in a listening state.");
        return -1;
      }

      websgNetwork.listening = true;
      return 0;
    },
    close() {
      if (!websgNetwork.listening) {
        console.error("WebSGNetworking: Cannot close event listener, already in a closed state.");
        return -1;
      }

      websgNetwork.inbound.length = 0;
      websgNetwork.listening = false;
      return 0;
    },
    broadcast: (packetPtr: number, byteLength: number) => {
      try {
        const scriptPacket = readUint8Array(wasmCtx, packetPtr, byteLength);

        const msg = createScriptMessage(ctx, scriptPacket);

        broadcastReliable(ctx, network, msg);

        return 0;
      } catch (error) {
        console.error("WebSGNetworking: Error broadcasting packet:", error);
        return -1;
      }
    },
    get_packet_size() {
      const packets = websgNetwork.inbound;
      return packets.length === 0 ? 0 : packets[packets.length - 1].byteLength;
    },
    receive: (packetPtr: number, maxBufLength: number) => {
      try {
        if (!websgNetwork.listening) {
          console.error("WebSGNetworking: Cannot receive packets in a closed state.");
          return -1;
        }

        const packet = websgNetwork.inbound.pop();

        if (!packet) {
          return 0;
        }

        if (packet.byteLength > maxBufLength) {
          console.error("Failed to receive script packet, packet length exceeded buffer length");
          return -1;
        }

        return writeArrayBuffer(wasmCtx, packetPtr, packet);
      } catch (e) {
        console.error("Error writing packet to write buffer:", e);
        return -1;
      }
    },
  };
}

const messageView = createCursorView(new ArrayBuffer(10000));

function createScriptMessage(ctx: GameState, packet: ArrayBuffer) {
  const data: NetPipeData = [ctx, messageView, ""];
  writeMetadata(NetworkAction.ScriptMessage)(data);
  serializeScriptMessage(data, packet);
  return sliceCursorView(messageView);
}

function serializeScriptMessage(data: NetPipeData, packet: ArrayBuffer) {
  const [, v] = data;
  writeUint32(v, packet.byteLength);
  cursorWriteArrayBuffer(v, packet);
  return data;
}

function deserializeScriptMessage(data: NetPipeData) {
  const [ctx, v] = data;
  const webSgNet = getModule(ctx, WebSGNetworkModule);
  const len = readUint32(v);
  const packet = readArrayBuffer(v, len);
  webSgNet.inbound.push(packet);
}
