import { availableRead } from "@thirdroom/ringbuffer";

import { createCursorView } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { GameNetworkState, NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { dequeueNetworkRingBuffer } from "./RingBuffer";
import { NetPipeData, readMetadata } from "./serialization.game";

const processNetworkMessage = (state: GameState, peerId: string, msg: ArrayBuffer) => {
  const network = getModule(state, NetworkModule);

  const cursorView = createCursorView(msg);
  const { type: messageType, elapsed } = readMetadata(cursorView);

  const input: NetPipeData = [state, cursorView, peerId];
  const { messageHandlers } = getModule(state, NetworkModule);

  const historian = network.peerIdToHistorian.get(peerId);
  if (historian) {
    historian.latestElapsed = elapsed;
    historian.localElapsed = elapsed;
    historian.needsUpdate = true;
  }

  const handler = messageHandlers[messageType];
  if (!handler) {
    console.error(
      "could not process network message, no handler registered for messageType",
      NetworkAction[messageType]
    );
    return;
  }

  handler(input);
};

const ringOut = { packet: new ArrayBuffer(0), peerId: "", broadcast: false };
// const arr: [string, ArrayBuffer][] = [];
const processNetworkMessages = (state: GameState) => {
  try {
    const network = getModule(state, NetworkModule);

    while (availableRead(network.incomingRingBuffer)) {
      dequeueNetworkRingBuffer(network.incomingRingBuffer, ringOut);
      if (ringOut.peerId && ringOut.packet) {
        // arr.unshift([ringOut.peerId, ringOut.packet]);
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
