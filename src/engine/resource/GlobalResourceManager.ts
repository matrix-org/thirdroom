import { MemPool } from "@thi.ng/malloc";

import { IResourceManager, MAX_C_STRING_BYTE_LENGTH } from "./IResourceManager";

export class GlobalResourceManager implements IResourceManager {
  buffer: SharedArrayBuffer;
  U8Heap: Uint8Array;
  U32Heap: Uint32Array;
  textDecoder: TextDecoder;
  textEncoder: TextEncoder;

  private pool: MemPool;

  constructor() {
    this.buffer = new SharedArrayBuffer(64 * 1024 * 1024);
    this.pool = new MemPool({
      buf: this.buffer,
    });
    this.U8Heap = new Uint8Array(this.buffer);
    this.U32Heap = new Uint32Array(this.buffer);
    this.textDecoder = new TextDecoder();
    this.textEncoder = new TextEncoder();
  }

  allocate(byteLength: number): number {
    return this.pool.malloc(byteLength);
  }

  deallocate(ptr: number): void {
    this.pool.free(ptr);
  }

  allocateString(value: string): number {
    const arr = this.textEncoder.encode(value);
    const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
    nullTerminatedArr.set(arr);
    const ptr = this.allocate(nullTerminatedArr.byteLength);
    this.U8Heap.set(nullTerminatedArr, ptr);
    return ptr;
  }

  decodeString(ptr: number): string {
    if (!ptr) {
      return "";
    }

    const maxPtr = ptr + MAX_C_STRING_BYTE_LENGTH;
    let end = ptr;

    // Find the end of the null-terminated C string on the heap
    while (!(end >= maxPtr) && this.U8Heap[end]) {
      ++end;
    }

    // create a new subarray to store the string so that this always works with SharedArrayBuffer
    return this.textDecoder.decode(this.U8Heap.subarray(ptr, end));
  }

  encodeString(ptr: number, value: string): number {
    if (!ptr || !value) {
      return 0;
    }

    const strPtr = this.allocateString(value);
    this.U32Heap[ptr / Uint32Array.BYTES_PER_ELEMENT] = strPtr;
    return strPtr;
  }
}
