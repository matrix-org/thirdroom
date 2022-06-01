import { RingBuffer } from "ringbuf.js";

export interface InputRingBuffer {
  ringbuf: RingBuffer;
  mem: ArrayBuffer;
  array: Uint8Array;
  view: DataView;
}

const BYTE_LENGTH = 5;

export function createInputRingBuffer(ringbuf: RingBuffer): InputRingBuffer {
  if (ringbuf.type() !== "Float32Array") throw new Error("input ring buffer must be of type Float32Array");
  const mem = new ArrayBuffer(BYTE_LENGTH);
  const array = new Uint8Array(mem);
  const view = new DataView(mem);
  return {
    ringbuf,
    mem,
    array,
    view,
  };
}

export function enqueueInputRingBuffer(irb: InputRingBuffer, keyCode: number, value: number) {
  irb.view.setUint8(0, keyCode);
  irb.view.setFloat32(1, value);
  if (irb.ringbuf.available_write() < BYTE_LENGTH) {
    return false;
  }
  return irb.ringbuf.push(irb.array, irb.array.length) === BYTE_LENGTH;
}

export function dequeueInputRingBuffer(irb: InputRingBuffer, out: { keyCode: number; value: number }) {
  if (irb.ringbuf.empty()) {
    return false;
  }
  const rv = irb.ringbuf.pop(irb.array, irb.array.length);
  out.keyCode = irb.view.getUint8(0);
  out.value = irb.view.getFloat32(1);

  return rv === irb.array.length;
}
