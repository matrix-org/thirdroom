export function toSharedArrayBuffer(arrayBuffer: ArrayBuffer, byteOffset = 0, byteLength?: number): SharedArrayBuffer {
  const readView = new Uint8Array(arrayBuffer, byteOffset, byteLength);
  const sharedBuffer = new SharedArrayBuffer(byteLength || arrayBuffer.byteLength);
  const writeView = new Uint8Array(sharedBuffer);
  writeView.set(readView);
  return sharedBuffer;
}
