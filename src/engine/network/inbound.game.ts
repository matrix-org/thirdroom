import { availableRead } from "@thirdroom/ringbuffer";

import { createCursorView, CursorView } from "../allocator/CursorView";
import { GameContext } from "../GameTypes";
import { getModule } from "../module/module.common";
import { GameNetworkState, NetworkModule } from "./network.game";
import { NetworkMessage } from "./NetworkMessage";
import { dequeueNetworkRingBuffer } from "./NetworkRingBuffer";
import { readMessageType } from "./serialization.game";

const processNetworkMessage = (ctx: GameContext, peerId: string, msg: ArrayBuffer) => {
  const cursorView = createCursorView(msg);
  const messageType = readMessageType(cursorView);

  // TODO: refactor network interpolator
  // const network = getModule(ctx, NetworkModule);
  // const historian = network.peerIdToHistorian.get(peerId);
  // if (historian) {
  //   historian.latestTime = elapsed;
  //   historian.localTime = elapsed;
  //   historian.needsUpdate = true;
  // }

  const { messageHandlers } = getModule(ctx, NetworkModule);

  const handler = messageHandlers[messageType];
  if (!handler) {
    console.error(
      "could not process network message, no handler registered for messageType",
      NetworkMessage[messageType]
    );
    return;
  }

  handler(ctx, cursorView, peerId);
};

const ringOut = { packet: new ArrayBuffer(0), peerId: "", broadcast: false };
const processNetworkMessages = (ctx: GameContext, network: GameNetworkState) => {
  try {
    while (availableRead(network.incomingReliableRingBuffer)) {
      dequeueNetworkRingBuffer(network.incomingReliableRingBuffer, ringOut);
      const { peerId, packet } = ringOut;
      if (!peerId) {
        console.error("unable to process reliable network message, peerId undefined");
        continue;
      }
      if (!packet) {
        console.error("unable to process reliable network message, packet undefined");
        continue;
      }

      processNetworkMessage(ctx, ringOut.peerId, ringOut.packet);
    }

    while (availableRead(network.incomingUnreliableRingBuffer)) {
      dequeueNetworkRingBuffer(network.incomingUnreliableRingBuffer, ringOut);

      const { peerId, packet } = ringOut;
      if (!peerId) {
        console.error("unable to process unreliable network message, peerId undefined");
        continue;
      }
      if (!packet) {
        console.error("unable to process unreliable network message, packet undefined");
        continue;
      }

      processNetworkMessage(ctx, ringOut.peerId, ringOut.packet);
    }
  } catch (e) {
    console.error(e);
  }
};

export const registerInboundMessageHandler = (
  network: GameNetworkState,
  type: number,
  cb: (ctx: GameContext, v: CursorView, peerId: string) => void
) => {
  if (network.messageHandlers[type]) {
    throw new Error("Cannot re-register more than one inbound network message handlers.");
  }
  network.messageHandlers[type] = cb;
};

export function InboundNetworkSystem(ctx: GameContext) {
  const network = getModule(ctx, NetworkModule);

  // only recieve updates when we have connected to the host
  // (probaby unecessary since all updates come from the host and we might be the host)
  if (network.hostId && network.peers.length) {
    processNetworkMessages(ctx, network);
  }
}
