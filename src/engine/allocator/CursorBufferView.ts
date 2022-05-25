import { CursorBuffer, createCursorBuffer, clearCursorBuffer } from "./CursorBuffer";

const $cursorBuffer = Symbol("cursorBuffer");

export type CursorBufferView<T> = T & { [$cursorBuffer]: CursorBuffer };

// TODO: We don't need to be allocating a whole 10MB for cursor buffer views.
// We know the size up front. So, perhaps we should allocate TypedArrays and concatenate them
// into a single array buffer instead?
export function createCursorBufferView<T>(
  viewConstructor: (buffer: CursorBuffer) => T,
  buffer?: ArrayBuffer
): CursorBufferView<T> {
  const cursorBuffer = createCursorBuffer(buffer);
  return Object.assign(viewConstructor(cursorBuffer), { [$cursorBuffer]: cursorBuffer });
}

export function getBuffer(cbv: CursorBufferView<unknown>): ArrayBuffer {
  return cbv[$cursorBuffer];
}

export function clearCursorBufferView(cbv: CursorBufferView<unknown>) {
  clearCursorBuffer(cbv[$cursorBuffer]);
}
