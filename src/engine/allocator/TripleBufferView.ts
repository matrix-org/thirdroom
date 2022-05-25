import { clearCursorBuffer, createCursorBuffer, CursorBuffer } from "./CursorBuffer";
import { createTripleBuffer, getReadBufferIndex, getWriteBufferIndex, TripleBuffer } from "./TripleBuffer";

const $cursorBuffers = Symbol("cursorBuffers");

export interface TripleBufferView<T> {
  tripleBuffer: TripleBuffer;
  views: T[];
  [$cursorBuffers]: CursorBuffer[];
}

export function createTripleBufferView<T>(
  constructView: (cursorBuffer: CursorBuffer) => T,
  tripleBuffer = createTripleBuffer()
): TripleBufferView<T> {
  const cursorBuffers = tripleBuffer.buffers.map(createCursorBuffer);
  const views = cursorBuffers.map(constructView);

  return {
    tripleBuffer,
    views,
    [$cursorBuffers]: cursorBuffers,
  };
}

export function getReadView<T>(tbv: TripleBufferView<T>) {
  const index = getReadBufferIndex(tbv.tripleBuffer);
  return tbv.views[index];
}

export function getWriteView<T>(tbv: TripleBufferView<T>) {
  const index = getWriteBufferIndex(tbv.tripleBuffer);
  return tbv.views[index];
}

export function clearWriteView(tbv: TripleBufferView<unknown>) {
  const index = getWriteBufferIndex(tbv.tripleBuffer);
  clearCursorBuffer(tbv[$cursorBuffers][index]);
}
