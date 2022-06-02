import { createCursorView, readFloat32, readUint8, writeFloat32, writeUint8 } from "../allocator/CursorView";
import { TypedArrayConstructor } from "../allocator/types";
import {
  availableWrite,
  createRingBuffer,
  isRingBufferEmpty,
  popRingBuffer,
  pushRingBuffer,
  RingBuffer,
} from "../ringbuffer/RingBuffer";

export interface InputRingBuffer<T extends TypedArrayConstructor> extends RingBuffer<T> {
  buffer: ArrayBuffer;
  array: Uint8Array;
  view: DataView;
}

const BYTE_LENGTH = Uint8Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT;

export function createInputRingBuffer<T extends TypedArrayConstructor>(type: T, capacity?: number): InputRingBuffer<T> {
  const ringBuffer = createRingBuffer(type, capacity);
  const buffer = new ArrayBuffer(BYTE_LENGTH);
  const array = new Uint8Array(buffer);
  const view = new DataView(buffer);
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
  const cv = createCursorView(irb.buffer);
  writeUint8(cv, keyCode);
  writeFloat32(cv, values[0]);
  writeFloat32(cv, values[1]);
  if (availableWrite(irb) < BYTE_LENGTH) {
    return false;
  }
  return pushRingBuffer(irb, irb.array, irb.array.length) === BYTE_LENGTH;
}

export function dequeueInputRingBuffer<T extends TypedArrayConstructor>(
  irb: InputRingBuffer<T>,
  out: { keyCode: number; values: number[] }
) {
  if (isRingBufferEmpty(irb)) {
    return false;
  }
  const rv = popRingBuffer(irb, irb.array, irb.array.length);
  const cv = createCursorView(irb.buffer);
  out.keyCode = readUint8(cv);
  out.values[0] = readFloat32(cv);
  out.values[1] = readFloat32(cv);

  return rv === irb.array.length;
}
