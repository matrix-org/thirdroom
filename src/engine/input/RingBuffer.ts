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
  readUint32,
  readUint8,
  sliceCursorView,
  writeFloat32,
  writeUint32,
  writeUint8,
} from "../allocator/CursorView";
import { InputComponentState } from "./input.common";

export interface InputRingBuffer extends RingBuffer<Float32ArrayConstructor> {
  buffer: ArrayBuffer;
  array: Uint8Array;
  view: CursorView;
}

export const RING_BUFFER_MAX = 200;

const BYTE_LENGTH =
  2 * Uint8Array.BYTES_PER_ELEMENT + 3 * Float32Array.BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT;

export function createInputRingBuffer(capacity?: number): InputRingBuffer {
  const ringBuffer = createRingBuffer(Float32Array, capacity);
  const buffer = new ArrayBuffer(BYTE_LENGTH);
  const array = new Uint8Array(buffer);
  const view = createCursorView(buffer);
  return Object.assign(ringBuffer, {
    buffer,
    array,
    view,
  });
}

export function enqueueInputRingBuffer(
  irb: InputRingBuffer,
  inputSourceId: number,
  componentId: number,
  button: number,
  xAxis: number,
  yAxis: number,
  state: number
) {
  const { view } = irb;

  moveCursorView(view, 0);
  writeUint8(view, inputSourceId);
  writeUint8(view, componentId);
  writeFloat32(view, button);
  writeFloat32(view, xAxis);
  writeFloat32(view, yAxis);
  writeUint32(view, state);

  if (availableWrite(irb) < BYTE_LENGTH) {
    return false;
  }

  return pushRingBuffer(irb, irb.array) === BYTE_LENGTH;
}

export function dequeueInputRingBuffer(irb: InputRingBuffer, out: InputComponentState) {
  if (isRingBufferEmpty(irb)) {
    return false;
  }
  popRingBuffer(irb, irb.array);

  const { view } = irb;
  moveCursorView(view, 0);

  out.inputSourceId = readUint8(view);
  out.componentId = readUint8(view);
  out.button = readFloat32(view);
  out.xAxis = readFloat32(view);
  out.yAxis = readFloat32(view);
  out.state = readUint32(view);

  return sliceCursorView(view);
}
