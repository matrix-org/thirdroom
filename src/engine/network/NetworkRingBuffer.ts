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
  writeUint32,
  writeUint8,
} from "../allocator/CursorView";
import { GameNetworkState } from "./network.game";

export interface NetworkRingBuffer extends RingBuffer<Uint8ArrayConstructor> {
  buffer: ArrayBuffer;
  array: Uint8Array;
  view: CursorView;
}

// 16KB allowed per packet * 1000 slots in the ring buffer = 16MB total preallocated
const MAX_PACKET_SIZE = 16000;

export function createNetworkRingBuffer(capacity = 1000): NetworkRingBuffer {
  const ringBuffer = createRingBuffer(Uint8Array, capacity * MAX_PACKET_SIZE);
  const buffer = new ArrayBuffer(MAX_PACKET_SIZE);
  const array = new Uint8Array(buffer);
  const view = createCursorView(buffer);
  return Object.assign(ringBuffer, {
    buffer,
    array,
    view,
  });
}

const textEncoder = new TextEncoder();
const writePeerKeyCache = new Map();
const writePeerKey = (v: CursorView, peerKey: string) => {
  let encoded = writePeerKeyCache.get(peerKey);
  if (!encoded) {
    encoded = textEncoder.encode(peerKey);
    writePeerKeyCache.set(peerKey, encoded);
  }

  writeUint8(v, encoded.byteLength);
  writeArrayBuffer(v, encoded);
  return v;
};

export function enqueueNetworkRingBuffer(
  rb: NetworkRingBuffer,
  peerKey: string,
  packet: ArrayBuffer,
  broadcast = false
) {
  const { view } = rb;

  moveCursorView(view, 0);

  // TODO: write peerIndex instead
  writePeerKey(view, peerKey);

  writeUint8(view, broadcast ? 1 : 0);

  writeUint32(view, packet.byteLength);
  writeArrayBuffer(view, packet);

  if (availableWrite(rb) < MAX_PACKET_SIZE) {
    return false;
  }

  return pushRingBuffer(rb, rb.array) === MAX_PACKET_SIZE;
}

export function dequeueNetworkRingBuffer(
  rb: NetworkRingBuffer,
  out: { packet: ArrayBuffer; peerKey: string; broadcast: boolean }
) {
  if (isRingBufferEmpty(rb)) {
    return false;
  }
  const rv = popRingBuffer(rb, rb.array);

  const { view } = rb;
  moveCursorView(view, 0);

  out.peerKey = readString(view);

  out.broadcast = readUint8(view) ? true : false;

  const packetByteLength = readUint32(view);
  out.packet = readArrayBuffer(view, packetByteLength);

  return rv === rb.array.length;
}

export const enqueueReliableBroadcast = (network: GameNetworkState, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingReliableRingBuffer, "", packet, true)) {
    console.warn("outgoing reliable network ring buffer full");
  }
};

export const enqueueUnreliableBroadcast = (network: GameNetworkState, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingUnreliableRingBuffer, "", packet, true)) {
    console.warn("outgoing unreliable network ring buffer full");
  }
};

export const enqueueReliable = (network: GameNetworkState, peerId: string, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingReliableRingBuffer, peerId, packet)) {
    console.warn("outgoing reliable network ring buffer full");
  }
};

export const enqueueUnreliable = (network: GameNetworkState, peerId: string, packet: ArrayBuffer) => {
  if (!packet.byteLength) return;
  if (!enqueueNetworkRingBuffer(network.outgoingUnreliableRingBuffer, peerId, packet)) {
    console.warn("outgoing unreliable network ring buffer full");
  }
};
