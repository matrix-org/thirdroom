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
  // ringbuf: RingBuffer<T>;
  buffer: ArrayBuffer;
  array: Uint8Array;
  view: DataView;
}

const BYTE_LENGTH = 5;

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
  value: number
) {
  irb.view.setUint8(0, keyCode);
  irb.view.setFloat32(1, value);
  if (availableWrite(irb) < BYTE_LENGTH) {
    return false;
  }
  return pushRingBuffer(irb, irb.array, irb.array.length) === BYTE_LENGTH;
}

export function dequeueInputRingBuffer<T extends TypedArrayConstructor>(
  irb: InputRingBuffer<T>,
  out: { keyCode: number; value: number }
) {
  if (isRingBufferEmpty(irb)) {
    return false;
  }
  const rv = popRingBuffer(irb, irb.array, irb.array.length);
  out.keyCode = irb.view.getUint8(0);
  out.value = irb.view.getFloat32(1);

  return rv === irb.array.length;
}
