import { CursorView } from "../allocator/CursorView";
import { RemoteResourceManager } from "../GameTypes";
import { toSharedArrayBuffer } from "../utils/arraybuffer";

export interface WASMModuleContext {
  memory: WebAssembly.Memory;
  U8Heap: Uint8Array;
  U32Heap: Uint32Array;
  F32Heap: Float32Array;
  textEncoder: TextEncoder;
  textDecoder: TextDecoder;
  cursorView: CursorView;
  encodedJSSource?: Uint8Array;
  resourceManager: RemoteResourceManager;
}

export function writeString(wasmCtx: WASMModuleContext, ptr: number, value: string, maxBufLength?: number) {
  const arr = wasmCtx.textEncoder.encode(value);

  if (maxBufLength !== undefined && arr.byteLength > maxBufLength) {
    throw new Error("Exceeded maximum byte length");
  }

  return writeEncodedString(wasmCtx, ptr, arr);
}

export function writeEncodedString(wasmCtx: WASMModuleContext, ptr: number, arr: Uint8Array) {
  const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
  nullTerminatedArr.set(arr);
  wasmCtx.U8Heap.set(nullTerminatedArr, ptr);
  // Don't include null character in byte length
  return arr.byteLength;
}

export function readString(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  if (!ptr) {
    return "";
  }

  const maxPtr = ptr + byteLength;
  let end = ptr;

  // Find the end of the null-terminated C string on the heap
  while (!(end >= maxPtr) && wasmCtx.U8Heap[end]) {
    ++end;
  }

  // create a new subarray to store the string so that this always works with SharedArrayBuffer
  return wasmCtx.textDecoder.decode(wasmCtx.U8Heap.slice(ptr, end));
}

export function readJSON(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  const jsonString = readString(wasmCtx, ptr, byteLength);
  return JSON.parse(jsonString);
}

export function writeUint8Array(wasmCtx: WASMModuleContext, ptr: number, array: Uint8Array) {
  wasmCtx.U8Heap.set(array, ptr);
  return array.byteLength;
}

export function readUint8Array(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  return wasmCtx.U8Heap.subarray(ptr, ptr + byteLength);
}

export function writeUint32Array(wasmCtx: WASMModuleContext, ptr: number, array: Uint8Array) {
  wasmCtx.U32Heap.set(array, ptr / 4);
  return array.byteLength;
}

export function readUint32Array(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  return wasmCtx.U32Heap.subarray(ptr / 4, (ptr + byteLength) / 4);
}

export function writeFloat32Array(wasmCtx: WASMModuleContext, ptr: number, array: Float32Array) {
  wasmCtx.F32Heap.set(array, ptr / 4);
  return array.byteLength;
}

export function readFloat32Array(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  return wasmCtx.F32Heap.subarray(ptr / 4, (ptr + byteLength) / 4);
}

export function readFloat32ArrayInto(wasmCtx: WASMModuleContext, ptr: number, target: Float32Array) {
  const F32Heap = wasmCtx.F32Heap;
  const offset = ptr / 4;

  for (let i = 0; i < target.length; i++) {
    target[i] = F32Heap[offset + i];
  }

  return target;
}

export function writeArrayBuffer(wasmCtx: WASMModuleContext, ptr: number, array: ArrayBuffer) {
  return writeUint8Array(wasmCtx, ptr, new Uint8Array(array));
}

export function readArrayBuffer(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  return wasmCtx.memory.buffer.slice(ptr, ptr + byteLength);
}

export function readSharedArrayBuffer(wasmCtx: WASMModuleContext, ptr: number, byteLength: number) {
  return toSharedArrayBuffer(wasmCtx.memory.buffer, ptr, byteLength);
}
