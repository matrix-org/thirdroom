const MAX_C_STRING_BYTE_LENGTH = 1024;
const textDecoder = new TextDecoder();

export function decodeString(ptr: number, heap: Uint8Array) {
  if (!ptr) {
    return "";
  }

  const maxPtr = ptr + MAX_C_STRING_BYTE_LENGTH;
  let end = ptr;

  // Find the end of the null-terminated C string on the heap
  while (!(end >= maxPtr) && heap[end]) {
    ++end;
  }

  // create a new subarray to store the string so that this always works with SharedArrayBuffer
  return textDecoder.decode(heap.slice(ptr, end));
}
