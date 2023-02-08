import { createCursorView, readArrayBuffer, sliceCursorView, writeArrayBuffer } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";
import { ScriptResourceManager } from "../resource/ScriptResourceManager";
import { NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { broadcastReliable } from "./outbound.game";
import { NetPipeData, writeMetadata } from "./serialization.game";
import { writeUint32, readUint32 } from "../allocator/CursorView";
import { registerInboundMessageHandler } from "./inbound.game";

interface WebSGNetworkModuleState {
  scriptToInbound: Map<number, ArrayBuffer[]>;
}

export const WebSGNetworkModule = defineModule<GameState, WebSGNetworkModuleState>({
  name: "WebSGNetwork",
  create: () => {
    return {
      scriptToInbound: new Map(),
    };
  },
  init(ctx: GameState) {
    const network = getModule(ctx, NetworkModule);
    registerInboundMessageHandler(network, NetworkAction.ScriptMessage, deserializeScriptMessage);
  },
});

export function createWebSGNetworkModule(ctx: GameState, resourceManager: ScriptResourceManager) {
  const network = getModule(ctx, NetworkModule);
  const { scriptToInbound } = getModule(ctx, WebSGNetworkModule);
  const { U8Heap } = resourceManager;

  return {
    network_broadcast: (packetPtr: number, byteLength: number) => {
      try {
        const scriptPacket = U8Heap.subarray(packetPtr, packetPtr + byteLength);

        const msg = createScriptMessage(ctx, resourceManager.id!, scriptPacket);

        broadcastReliable(ctx, network, msg);

        return 0;
      } catch (error) {
        console.error("Error broadcasting packet:", error);
        return -1;
      }
    },
    // call until 0 return
    network_receive: (writeBufPtr: number, maxBufLength: number) => {
      const inbound = scriptToInbound.get(resourceManager.id!);
      const packet = inbound!.pop();

      if (!packet) {
        return 0;
      }

      if (packet.byteLength > maxBufLength) {
        console.error("Failed to receive script packet, packet length exceeded buffer length");
        return -1;
      }

      try {
        U8Heap.set(new Uint8Array(packet), writeBufPtr);
        return 1;
      } catch (e) {
        console.error("Error writing packet to write buffer:", e);
        return -1;
      }
    },
  };
}

const messageView = createCursorView(new ArrayBuffer(10000));

function createScriptMessage(ctx: GameState, scriptId: number, packet: ArrayBuffer) {
  const data: NetPipeData = [ctx, messageView, ""];
  writeMetadata(NetworkAction.ScriptMessage)(data);
  serializeScriptMessage(data, scriptId, packet);
  return sliceCursorView(messageView);
}
function serializeScriptMessage(data: NetPipeData, scriptId: number, packet: ArrayBuffer) {
  const [, v] = data;
  writeUint32(v, scriptId);
  writeUint32(v, packet.byteLength);
  writeArrayBuffer(v, packet);
  return data;
}
function deserializeScriptMessage(data: NetPipeData) {
  const [ctx, v] = data;
  const webSgNet = getModule(ctx, WebSGNetworkModule);
  const id = readUint32(v);
  const len = readUint32(v);
  const packet = readArrayBuffer(v, len);
  const queue = webSgNet.scriptToInbound.get(id);
  if (!queue) {
    throw new Error("could not find script to forward network message to: " + id);
  }
  queue.push(packet);
}
