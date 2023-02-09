import { createCursorView, readArrayBuffer, sliceCursorView, writeArrayBuffer } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";
import { NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { broadcastReliable } from "./outbound.game";
import { NetPipeData, writeMetadata } from "./serialization.game";
import { writeUint32, readUint32 } from "../allocator/CursorView";
import { registerInboundMessageHandler } from "./inbound.game";
import { WASMModuleContext } from "../scripting/WASMModuleContext";

interface WebSGNetworkModuleState {
  inbound: ArrayBuffer[];
}

export const WebSGNetworkModule = defineModule<GameState, WebSGNetworkModuleState>({
  name: "WebSGNetwork",
  create: () => {
    return {
      inbound: [],
    };
  },
  init(ctx: GameState) {
    const network = getModule(ctx, NetworkModule);
    registerInboundMessageHandler(network, NetworkAction.ScriptMessage, deserializeScriptMessage);
  },
});

export function createWebSGNetworkModule(ctx: GameState, { U8Heap }: WASMModuleContext) {
  const network = getModule(ctx, NetworkModule);
  const { inbound } = getModule(ctx, WebSGNetworkModule);

  return {
    network_broadcast: (packetPtr: number, byteLength: number) => {
      try {
        const scriptPacket = U8Heap.subarray(packetPtr, packetPtr + byteLength);

        const msg = createScriptMessage(ctx, scriptPacket);

        broadcastReliable(ctx, network, msg);

        return 0;
      } catch (error) {
        console.error("Error broadcasting packet:", error);
        return -1;
      }
    },
    // call until 0 return
    network_receive: (writeBufPtr: number, maxBufLength: number) => {
      const packet = inbound.pop();

      if (!packet) {
        return 0;
      }

      if (packet.byteLength > maxBufLength) {
        console.error("Failed to receive script packet, packet length exceeded buffer length");
        return -1;
      }

      try {
        U8Heap.set(new Uint8Array(packet), writeBufPtr);
        return packet.byteLength;
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
  writeArrayBuffer(v, packet);
  return data;
}

function deserializeScriptMessage(data: NetPipeData) {
  const [ctx, v] = data;
  const webSgNet = getModule(ctx, WebSGNetworkModule);
  const len = readUint32(v);
  const packet = readArrayBuffer(v, len);
  webSgNet.inbound.push(packet);
}
