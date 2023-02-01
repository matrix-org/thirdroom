import { availableWrite, createRingBuffer, popRingBuffer, pushRingBuffer, RingBuffer } from "@thirdroom/ringbuffer";

import { createCursorView, CursorView, moveCursorView, readUint32, writeUint32 } from "../allocator/CursorView";
import { maxEntities } from "../config.common";

export interface ResourceRingBufferItem {
  eid: number;
  tick: number;
}

export interface ResourceRingBuffer extends RingBuffer<Uint32ArrayConstructor> {
  buffer: ArrayBuffer;
  array: Uint8Array;
  view: CursorView;
}

const MAX_PACKET_SIZE = 2 * Uint32Array.BYTES_PER_ELEMENT;

export function createResourceRingBuffer(size = maxEntities): ResourceRingBuffer {
  const ringBuffer = createRingBuffer(Uint32Array, size * MAX_PACKET_SIZE);
  const buffer = new ArrayBuffer(MAX_PACKET_SIZE);
  const array = new Uint8Array(buffer);
  const view = createCursorView(buffer);
  return Object.assign(ringBuffer, {
    buffer,
    array,
    view,
  });
}

export function enqueueResourceRingBuffer(rb: ResourceRingBuffer, eid: number, tick: number) {
  const { view } = rb;

  moveCursorView(view, 0);

  writeUint32(view, eid);
  writeUint32(view, tick);

  if (availableWrite(rb) < MAX_PACKET_SIZE) {
    throw new Error("Resource ring buffer full.");
  }

  return pushRingBuffer(rb, rb.array) === MAX_PACKET_SIZE;
}

export function dequeueResourceRingBuffer(
  ringBuffer: ResourceRingBuffer,
  item: ResourceRingBufferItem
): ResourceRingBufferItem {
  popRingBuffer(ringBuffer, ringBuffer.array);
  moveCursorView(ringBuffer.view, 0);
  item.eid = readUint32(ringBuffer.view);
  item.tick = readUint32(ringBuffer.view);
  return item;
}
