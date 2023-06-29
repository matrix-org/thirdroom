import { availableRead } from "@thirdroom/ringbuffer";

import { createCursorView, CursorView } from "../allocator/CursorView";
import { GameContext } from "../GameTypes";
import { getModule } from "../module/module.common";
import { GameNetworkState, NetworkModule, ownedPlayerQuery } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { dequeueNetworkRingBuffer } from "./RingBuffer";
import { readMetadata } from "./serialization.game";

const processNetworkMessage = (ctx: GameContext, peerId: string, msg: ArrayBuffer) => {
  const network = getModule(ctx, NetworkModule);

  const cursorView = createCursorView(msg);

  const { type: messageType, elapsed, inputTick } = readMetadata(cursorView);

  const historian = network.peerIdToHistorian.get(peerId);

  if (historian) {
    // this value is written onto outgoing packet headers
    historian.latestTick = inputTick;
    historian.latestTime = elapsed;
    historian.localTime = elapsed;
    historian.needsUpdate = true;
  }

  const { messageHandlers } = getModule(ctx, NetworkModule);

  const handler = messageHandlers[messageType];
  if (!handler) {
    console.error(
      "could not process network message, no handler registered for messageType",
      NetworkAction[messageType]
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
  // TODO: hold a list of multiple handlers
  network.messageHandlers[type] = cb;
};

export function InboundNetworkSystem(ctx: GameContext) {
  const network = getModule(ctx, NetworkModule);

  // only recieve updates when:
  // - we have connected peers
  // - player rig has spawned
  const haveConnectedPeers = network.peers.length > 0;
  const spawnedPlayerRig = ownedPlayerQuery(ctx.world).length > 0;

  if (haveConnectedPeers && spawnedPlayerRig) {
    processNetworkMessages(ctx, network);
  }
}
