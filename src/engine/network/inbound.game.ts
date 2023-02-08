import { availableRead } from "@thirdroom/ringbuffer";

import { createCursorView } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { InputModule } from "../input/input.game";
import { getModule } from "../module/module.common";
import { trimHistory } from "../utils/Historian";
import { isHost } from "./network.common";
import { GameNetworkState, NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { dequeueNetworkRingBuffer } from "./RingBuffer";
import { NetPipeData, readMetadata } from "./serialization.game";

const processNetworkMessage = (ctx: GameState, peerId: string, msg: ArrayBuffer) => {
  const network = getModule(ctx, NetworkModule);
  const input = getModule(ctx, InputModule);
  const controller = input.activeController;

  const cursorView = createCursorView(msg);

  const { type: messageType, elapsed, inputTick } = readMetadata(cursorView);

  // trim off all inputs since the most recent host-processed input tick
  if (network.authoritative && !isHost(network) && inputTick) {
    // trim history up to this last received input tick
    trimHistory(controller.outbound, inputTick);
    // trigger input prediction
    (controller as any).needsUpdate = true;
  }

  const historian = network.peerIdToHistorian.get(peerId);

  if (historian) {
    // this value is written onto outgoing packet headers
    historian.latestTick = inputTick;
    historian.latestTime = elapsed;
    historian.localTime = elapsed;
    historian.needsUpdate = true;
  }

  const data: NetPipeData = [ctx, cursorView, peerId];
  const { messageHandlers } = getModule(ctx, NetworkModule);

  const handler = messageHandlers[messageType];
  if (!handler) {
    console.error(
      "could not process network message, no handler registered for messageType",
      NetworkAction[messageType]
    );
    return;
  }

  handler(data);
};

const ringOut = { packet: new ArrayBuffer(0), peerId: "", broadcast: false };
// const arr: [string, ArrayBuffer][] = [];
const processNetworkMessages = (state: GameState) => {
  try {
    const network = getModule(state, NetworkModule);

    while (availableRead(network.incomingReliableRingBuffer)) {
      dequeueNetworkRingBuffer(network.incomingReliableRingBuffer, ringOut);
      if (ringOut.peerId && ringOut.packet) {
        // arr.unshift([ringOut.peerId, ringOut.packet]);
        processNetworkMessage(state, ringOut.peerId, ringOut.packet);
      }
    }

    while (availableRead(network.incomingUnreliableRingBuffer)) {
      dequeueNetworkRingBuffer(network.incomingUnreliableRingBuffer, ringOut);
      if (ringOut.peerId && ringOut.packet) {
        processNetworkMessage(state, ringOut.peerId, ringOut.packet);
      }
    }

    // while (arr.length) {
    //   const a = arr.shift();
    //   if (a) processNetworkMessage(state, a[0], a[1]);
    // }
  } catch (e) {
    console.error(e);
  }
};

export const registerInboundMessageHandler = (
  network: GameNetworkState,
  type: number,
  cb: (input: NetPipeData) => void
) => {
  // TODO: hold a list of multiple handlers
  network.messageHandlers[type] = cb;
};

export function InboundNetworkSystem(state: GameState) {
  processNetworkMessages(state);
}
