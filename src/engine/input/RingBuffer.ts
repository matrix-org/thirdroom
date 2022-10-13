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
  readFloat32,
  readUint8,
  sliceCursorView,
  writeFloat32,
  writeUint8,
} from "../allocator/CursorView";
import { TypedArrayConstructor } from "../allocator/types";

export interface InputRingBuffer<T extends TypedArrayConstructor> extends RingBuffer<T> {
  buffer: ArrayBuffer;
  array: Uint8Array;
  view: CursorView;
}

export const RING_BUFFER_MAX = 100;

const BYTE_LENGTH = Uint8Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT;

export function createInputRingBuffer<T extends TypedArrayConstructor>(type: T, capacity?: number): InputRingBuffer<T> {
  const ringBuffer = createRingBuffer(type, capacity);
  const buffer = new ArrayBuffer(BYTE_LENGTH);
  const array = new Uint8Array(buffer);
  const view = createCursorView(buffer);
  return Object.assign(ringBuffer, {
    buffer,
    array,
    view,
  });
}

export function enqueueInputRingBuffer<T extends TypedArrayConstructor>(
  irb: InputRingBuffer<T>,
  keyCode: number,
  ...values: number[]
) {
  const { view } = irb;

  moveCursorView(view, 0);
  writeUint8(view, keyCode);
  writeFloat32(view, values[0] || 0);
  writeFloat32(view, values[1] || 0);

  if (availableWrite(irb) < BYTE_LENGTH) {
    return false;
  }

  return pushRingBuffer(irb, irb.array) === BYTE_LENGTH;
}

export function dequeueInputRingBuffer<T extends TypedArrayConstructor>(
  irb: InputRingBuffer<T>,
  out: { keyCode: number; values: number[] }
) {
  if (isRingBufferEmpty(irb)) {
    return false;
  }
  popRingBuffer(irb, irb.array);

  const { view } = irb;
  moveCursorView(view, 0);

  out.keyCode = readUint8(view);
  out.values[0] = readFloat32(view);
  out.values[1] = readFloat32(view);

  return sliceCursorView(view);
}
