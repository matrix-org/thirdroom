import { moveCursorView, rewindCursorView, sliceCursorView, spaceInt32, writeUint32 } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { NetworkModule } from "./network.game";
import { Networked, ownedNetworkedQuery } from "./NetworkComponents";
import { enqueueUnreliableBroadcastMessage } from "./NetworkRingBuffer";

let then = performance.now();
let delta = 0;

export function OutboundNetworkSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  // throttle outbound host messages by network tickRate
  if (network.hostPeerId === network.localPeerId) {
    const target = 1000 / network.tickRate;
    delta += performance.now() - then;
    then = performance.now();
    if (delta <= target) {
      return ctx;
    }
    delta = delta % target;
  }

  const entities = ownedNetworkedQuery(ctx.world);
  const outgoingRingBuffer = network.outgoingRingBuffer;
  const cursorView = outgoingRingBuffer.cursorView;
  moveCursorView(cursorView, 0);
  writeUint32(cursorView, Date.now()); // Time
  const setPacketDataByteLength = spaceInt32(cursorView);
  const packetDataOffset = cursorView.cursor;

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const synchronizerId = Networked.synchronizerId[eid];

    if (!synchronizerId) {
      continue;
    }

    const synchronizer = network.synchronizers.get(synchronizerId);

    if (!synchronizer) {
      continue;
    }

    const rewind = rewindCursorView(cursorView);
    writeUint32(cursorView, Networked.networkId[eid]);
    const setSyncDataByteLength = spaceInt32(cursorView);
    const syncDataOffset = cursorView.cursor;
    synchronizer.encode(eid, cursorView);

    const syncDataByteLength = cursorView.cursor - syncDataOffset;
    if (syncDataByteLength === 0) {
      rewind(); // If we didn't write any data, rewind the cursor
      continue;
    }
    setSyncDataByteLength(syncDataByteLength);
  }

  const packetDataByteLength = cursorView.cursor - packetDataOffset;

  if (packetDataByteLength === 0) {
    return;
  }

  setPacketDataByteLength(cursorView.cursor - packetDataOffset);
  const message = sliceCursorView(cursorView);
  enqueueUnreliableBroadcastMessage(outgoingRingBuffer, message);
}
