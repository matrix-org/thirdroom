/* Inbound */

import { createCursorView, readUint8, readFloat32 } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { GameNetworkState, NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { NetPipeData } from "./serialization.game";

const processNetworkMessage = (state: GameState, peerId: string, msg: ArrayBuffer) => {
  const network = getModule(state, NetworkModule);
  const cursorView = createCursorView(msg);
  const messageType = readUint8(cursorView);
  const elapsed = readFloat32(cursorView);
  const input: NetPipeData = [state, cursorView];
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

const processNetworkMessages = (state: GameState) => {
  try {
    const network = getModule(state, NetworkModule);
    while (network.incomingPackets.length) {
      const peerId = network.incomingPeerIds.pop();
      const msg = network.incomingPackets.pop();
      if (peerId && msg) processNetworkMessage(state, peerId, msg);
    }
  } catch (e) {
    console.error(e);
  }
};

export const registerInboundMessageHandler = (
  network: GameNetworkState,
  type: number,
  cb: (input: NetPipeData) => void
) => {
  network.messageHandlers[type] = cb;
};

export function InboundNetworkSystem(state: GameState) {
  processNetworkMessages(state);
}
