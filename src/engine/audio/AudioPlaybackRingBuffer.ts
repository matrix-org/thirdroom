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
  sliceCursorView,
  writeFloat32,
  writeUint32,
} from "../allocator/CursorView";

export enum AudioAction {
  Play,
  PlayOneShot,
  Pause,
  Stop,
  Seek,
}

export interface AudioPlaybackItem {
  action: AudioAction;
  audioSourceId: number;
  tick: number;
  playbackRate: number;
  gain: number;
  time: number;
}

export interface AudioPlaybackRingBuffer extends RingBuffer<Float32ArrayConstructor> {
  buffer: ArrayBuffer;
  array: Uint8Array;
  view: CursorView;
}

const numElements = 6;

export const RING_BUFFER_MAX = 64 * numElements;

const BYTE_LENGTH = numElements * Float32Array.BYTES_PER_ELEMENT;

export function createAudioPlaybackRingBuffer(capacity?: number): AudioPlaybackRingBuffer {
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

export const createAudioPlaybackItem = (): AudioPlaybackItem => ({
  action: AudioAction.Play,
  audioSourceId: 0,
  tick: 0,
  playbackRate: 1,
  gain: 1,
  time: 0,
});

export function enqueueAudioPlaybackRingBuffer(
  ringBuffer: AudioPlaybackRingBuffer,
  action: AudioAction,
  audioSourceId: number,
  tick: number,
  gain: number,
  playbackRate: number,
  time: number
) {
  const { view } = ringBuffer;

  moveCursorView(view, 0);
  writeUint32(view, action);
  writeUint32(view, audioSourceId);
  writeUint32(view, tick);
  writeFloat32(view, gain);
  writeFloat32(view, playbackRate);
  writeFloat32(view, time);

  if (availableWrite(ringBuffer) < BYTE_LENGTH) {
    return false;
  }

  return pushRingBuffer(ringBuffer, ringBuffer.array) === BYTE_LENGTH;
}

export function dequeueAudioPlaybackRingBuffer(ringBuffer: AudioPlaybackRingBuffer, out: AudioPlaybackItem) {
  if (isRingBufferEmpty(ringBuffer)) {
    return false;
  }
  popRingBuffer(ringBuffer, ringBuffer.array);

  const { view } = ringBuffer;
  moveCursorView(view, 0);

  out.action = readUint32(view);
  out.audioSourceId = readUint32(view);
  out.tick = readUint32(view);
  out.gain = readFloat32(view);
  out.playbackRate = readFloat32(view);
  out.time = readFloat32(view);

  return sliceCursorView(view);
}
