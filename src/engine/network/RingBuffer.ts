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
  readArrayBuffer,
  readString,
  readUint32,
  readUint8,
  writeArrayBuffer,
  writeString,
  writeUint32,
  writeUint8,
} from "../allocator/CursorView";
import { TypedArrayConstructor } from "../utils/typedarray";

export interface NetworkRingBuffer<T extends TypedArrayConstructor> extends RingBuffer<T> {
  buffer: ArrayBuffer;
  array: Uint8Array;
  view: CursorView;
}

// 16KB allowed per packet * 1000 slots in the ring buffer = 16MB total preallocated
const MAX_PACKET_SIZE = 16000;

export function createNetworkRingBuffer<T extends TypedArrayConstructor>(
  type: T,
  capacity = 1000
): NetworkRingBuffer<T> {
  const ringBuffer = createRingBuffer(type, capacity * MAX_PACKET_SIZE);
  const buffer = new ArrayBuffer(MAX_PACKET_SIZE);
  const array = new Uint8Array(buffer);
  const view = createCursorView(buffer);
  return Object.assign(ringBuffer, {
    buffer,
    array,
    view,
  });
}

const writePeerIdCache = new Map();
const writePeerId = (v: CursorView, peerId: string) => {
  const encoded = writePeerIdCache.get(peerId);
  if (encoded) {
    writeUint8(v, encoded.byteLength);
    writeArrayBuffer(v, encoded);
  } else {
    writeString(v, peerId);
  }
  return v;
};

export function enqueueNetworkRingBuffer<T extends TypedArrayConstructor>(
  rb: NetworkRingBuffer<T>,
  peerId: string,
  packet: ArrayBuffer,
  broadcast = false
) {
  const { view } = rb;

  moveCursorView(view, 0);

  // TODO: write peerIndex instead
  writePeerId(view, peerId);

  writeUint8(view, broadcast ? 1 : 0);

  writeUint32(view, packet.byteLength);
  writeArrayBuffer(view, packet);

  if (availableWrite(rb) < MAX_PACKET_SIZE) {
    return false;
  }

  return pushRingBuffer(rb, rb.array) === MAX_PACKET_SIZE;
}

export function dequeueNetworkRingBuffer<T extends TypedArrayConstructor>(
  rb: NetworkRingBuffer<T>,
  out: { packet: ArrayBuffer; peerId: string; broadcast: boolean }
) {
  if (isRingBufferEmpty(rb)) {
    return false;
  }
  const rv = popRingBuffer(rb, rb.array);

  const { view } = rb;
  moveCursorView(view, 0);

  out.peerId = readString(view);

  out.broadcast = readUint8(view) ? true : false;

  const packetByteLength = readUint32(view);
  out.packet = readArrayBuffer(view, packetByteLength);

  return rv === rb.array.length;
}
