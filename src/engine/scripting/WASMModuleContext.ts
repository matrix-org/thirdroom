import { RemoteResourceManager } from "../GameTypes";

export interface WASMModuleContext {
  memory: WebAssembly.Memory;
  U8Heap: Uint8Array;
  U32Heap: Uint32Array;
  textEncoder: TextEncoder;
  textDecoder: TextDecoder;
  encodedJSSource?: Uint8Array;
  resourceManager: RemoteResourceManager;
}

export function writeString(wasmCtx: WASMModuleContext, ptr: number, value: string, maxBufLength?: number) {
  const arr = wasmCtx.textEncoder.encode(value);

  if (maxBufLength !== undefined && arr.byteLength > maxBufLength) {
    throw new Error("Exceeded maximum byte length");
  }

  const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
  nullTerminatedArr.set(arr);
  wasmCtx.U8Heap.set(nullTerminatedArr, ptr);

  return arr.byteLength;
}

const MAX_C_STRING_BYTE_LENGTH = 1024;

export function readString(wasmCtx: WASMModuleContext, ptr: number, maxByteLength = MAX_C_STRING_BYTE_LENGTH) {
  if (!ptr) {
    return "";
  }

  const maxPtr = ptr + maxByteLength;
  let end = ptr;

  // Find the end of the null-terminated C string on the heap
  while (!(end >= maxPtr) && wasmCtx.U8Heap[end]) {
    ++end;
  }

  // create a new subarray to store the string so that this always works with SharedArrayBuffer
  return wasmCtx.textDecoder.decode(wasmCtx.U8Heap.slice(ptr, end));
}
