// Ported from https://github.com/p4checo/triplebuffer-sync
// Which is originally ported from https://github.com/remis-thoughts/blog/blob/master/triple-buffering/src/main/md/triple-buffering.md

export type TripleBufferState = {
  byteLength: number;
  buffers: SharedArrayBuffer[];
  views: Uint8Array[];
  flags: Uint8Array;
}

export const createTripleBuffer = (

  // default: 10MB per buffer * 3 buffers = 30MB total
  byteLength: number = 1e7,

  buffers: SharedArrayBuffer[] = [
    new SharedArrayBuffer(byteLength),
    new SharedArrayBuffer(byteLength),
    new SharedArrayBuffer(byteLength),
  ],

  views: Uint8Array[] = [
    new Uint8Array(buffers[0]),
    new Uint8Array(buffers[1]),
    new Uint8Array(buffers[2]),
  ],

  /**
   * template:
   * readBufferChanged: 0b0x000000
   * tempBufferIndex:   0b00xx0000
   * writeBufferIndex:  0b0000xx00
   * readBufferIndex:   0b000000xx
   * 
   * default: 0b00000110 (0x6)
   * readBufferChanged: false
   * tempBufferIndex:   0
   * writeBufferIndex:  1
   * readBufferIndex:   2
   */
  flags: Uint8Array = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)).fill(0x6)

): TripleBufferState => ({ byteLength, buffers, views, flags });

const readyToRead = (flags: number) => {
  return (flags & 0x40) !== 0;
};

const swapReadWithTemp = (flags: number) => {
  return (flags & 0x30) | ((flags & 0x3) << 2) | ((flags & 0xc) >> 2);
};

const swapWriteWithTempAndMarkChanged = (flags: number) => {
  return 0x40 | ((flags & 0xc) << 2) | ((flags & 0x30) >> 2) | (flags & 0x3);
};

export const getReadBufferIndex = (tb: TripleBufferState) => Atomics.load(tb.flags, 0) & 0x3;
export const getReadBuffer = (tb: TripleBufferState) => tb.buffers[getReadBufferIndex(tb)];
export const getReadView = (tb: TripleBufferState) => tb.views[getReadBufferIndex(tb)];

export const getWriteBufferIndex = (tb: TripleBufferState) => (Atomics.load(tb.flags, 0) & 0x30) >> 4;
export const getWriteBuffer = (tb: TripleBufferState) => tb.buffers[getWriteBufferIndex(tb)];
export const copyToWriteBuffer = (tb: TripleBufferState, buffer: ArrayBuffer) => 
  tb.views[getWriteBufferIndex(tb)].set(new Uint8Array(buffer));

export const swapReadBuffer = (tb: TripleBufferState) => {
  const flags = Atomics.load(tb.flags, 0);

  do {
    if (!readyToRead(flags)) {
      return false;
    }
  } while (
    Atomics.compareExchange(tb.flags, 0, flags, swapReadWithTemp(flags)) === flags
  );

  return true;
}

export const swapWriteBuffer = (tb: TripleBufferState) => {
  const flags = Atomics.load(tb.flags, 0);

  while (
    Atomics.compareExchange(
      tb.flags,
      0,
      flags,
      swapWriteWithTempAndMarkChanged(flags)
    ) === flags
  );
}