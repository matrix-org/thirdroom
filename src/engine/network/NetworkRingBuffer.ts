import {
  availableWrite,
  createRingBuffer,
  isRingBufferEmpty,
  popRingBuffer,
  pushRingBuffer,
  RingBuffer,
} from "@thirdroom/ringbuffer";

import {
  createCursorView,
  CursorView,
  moveCursorView,
  sliceCursorView,
  writeArrayBuffer,
  writeUint32,
  writeUint8,
} from "../allocator/CursorView";

export interface NetworkRingBuffer extends RingBuffer<Uint8ArrayConstructor> {
  cursorView: CursorView;
  overflowQueue: Uint8Array[]; // If the ring buffer is full, we'll push the packet here
}

// 16KB allowed per packet * 1000 slots in the ring buffer = 16MB total preallocated
const MAX_PACKET_SIZE = 16000;

export function createNetworkRingBuffer(capacity = 1000): NetworkRingBuffer {
  const ringBuffer = createRingBuffer(Uint8Array, capacity * MAX_PACKET_SIZE);

  return Object.assign(ringBuffer, {
    cursorView: createCursorView(new ArrayBuffer(MAX_PACKET_SIZE)),
    overflowQueue: [],
  });
}

export const BROADCAST_PEER_ID = 0;

export function enqueueNetworkMessage(rb: NetworkRingBuffer, reliable: boolean, to: number, data: ArrayBuffer) {
  const cursorView = rb.cursorView;

  // Drain any overflow queue messages that fit into the ring buffer before we queue our own
  while (rb.overflowQueue.length > 0 && rb.overflowQueue[0].byteLength <= availableWrite(rb)) {
    const message = rb.overflowQueue.shift();

    if (message) {
      moveCursorView(cursorView, 0);
      writeArrayBuffer(cursorView, message);
      pushRingBuffer(rb, rb.cursorView.byteView);
    }
  }

  moveCursorView(cursorView, 0);
  writeUint8(cursorView, reliable ? 1 : 0);
  writeUint32(cursorView, to);
  writeUint32(cursorView, data.byteLength);
  writeArrayBuffer(cursorView, data);

  if (availableWrite(rb) < MAX_PACKET_SIZE) {
    // Only store the piece of the current view that we've written to save memory
    const message = new Uint8Array(sliceCursorView(cursorView));
    rb.overflowQueue.push(message);
    return false;
  }

  pushRingBuffer(rb, rb.cursorView.byteView);
  return true;
}

export function enqueueReliableBroadcastMessage(rb: NetworkRingBuffer, data: ArrayBuffer) {
  return enqueueNetworkMessage(rb, true, BROADCAST_PEER_ID, data);
}

export function enqueueReliableDirectMessage(rb: NetworkRingBuffer, to: number, data: ArrayBuffer) {
  return enqueueNetworkMessage(rb, true, to, data);
}

export function enqueueUnreliableBroadcastMessage(rb: NetworkRingBuffer, data: ArrayBuffer) {
  return enqueueNetworkMessage(rb, false, BROADCAST_PEER_ID, data);
}

export function dequeueNetworkRingBuffer(rb: NetworkRingBuffer) {
  if (isRingBufferEmpty(rb)) {
    return false;
  }

  const cursorView = rb.cursorView;
  popRingBuffer(rb, cursorView.byteView);
  moveCursorView(cursorView, 0);
  return true;
}

export function disposeNetworkRingBuffer(rb: NetworkRingBuffer) {
  while (!isRingBufferEmpty(rb)) {
    popRingBuffer(rb, rb.cursorView.byteView);
  }
}
