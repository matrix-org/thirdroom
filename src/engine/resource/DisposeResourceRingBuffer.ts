import {
  availableRead,
  availableWrite,
  createRingBuffer,
  isRingBufferEmpty,
  popRingBuffer,
  pushRingBuffer,
  RingBuffer,
} from "@thirdroom/ringbuffer";

import { createCursorView, CursorView, moveCursorView, readUint32, writeUint32 } from "../allocator/CursorView";
import { maxEntities } from "../config.common";

export interface ResourceRingBuffer extends RingBuffer<Uint32ArrayConstructor> {
  buffer: ArrayBuffer;
  array: Uint8Array;
  view: CursorView;
  commandQueue: ResourceCommand[];
  tickQueue: number[];
  eidQueue: number[];
  results: [ResourceCommand, number][];
}

export enum ResourceCommand {
  Create,
  Dispose,
}

const MAX_PACKET_SIZE = 3 * Uint32Array.BYTES_PER_ELEMENT;

export function createResourceRingBuffer(): ResourceRingBuffer {
  const ringBuffer = createRingBuffer(Uint32Array, maxEntities * MAX_PACKET_SIZE);
  const buffer = new ArrayBuffer(MAX_PACKET_SIZE);
  const array = new Uint8Array(buffer);
  const view = createCursorView(buffer);
  return Object.assign(ringBuffer, {
    buffer,
    array,
    view,
    commandQueue: [],
    tickQueue: [],
    eidQueue: [],
    queue: [],
    results: [],
  });
}

export function enqueueResourceRingBuffer(rb: ResourceRingBuffer, command: ResourceCommand, tick: number, eid: number) {
  const { view } = rb;

  moveCursorView(view, 0);

  writeUint32(view, command);
  writeUint32(view, tick);
  writeUint32(view, eid);

  if (availableWrite(rb) < MAX_PACKET_SIZE) {
    return false;
  }

  return pushRingBuffer(rb, rb.array) === MAX_PACKET_SIZE;
}

export function drainResourceRingBuffer(
  ringBuffer: ResourceRingBuffer,
  currentTick: number
): [ResourceCommand, number][] {
  const { commandQueue, tickQueue, eidQueue, view, array, results } = ringBuffer;

  results.length = 0;

  while (tickQueue.length) {
    const tick = tickQueue[0];

    if (tick <= currentTick) {
      tickQueue.shift();
      const command = commandQueue.shift()!;
      const eid = eidQueue.shift()!;
      results.push([command, eid]);
    } else {
      break;
    }
  }

  while (availableRead(ringBuffer)) {
    if (isRingBufferEmpty(ringBuffer)) {
      break;
    }

    popRingBuffer(ringBuffer, array);

    moveCursorView(view, 0);

    const command = readUint32(view);
    const tick = readUint32(view);
    const eid = readUint32(view);

    if (tick <= currentTick) {
      results.push([command, eid]);
    } else {
      tickQueue.push(eid);
      eidQueue.push(eid);
    }
  }

  return results;
}
