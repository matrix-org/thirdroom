// Ported from https://github.com/p4checo/triplebuffer-sync
// Which is originally ported from https://github.com/remis-thoughts/blog/blob/master/triple-buffering/src/main/md/triple-buffering.md

export type TripleBuffer = {
  byteLength: number;
  buffers: SharedArrayBuffer[];
  byteViews: Uint8Array[];
  flags: Uint8Array;
};

export const createTripleBuffer = (
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
  flags: Uint8Array = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)).fill(0x6),

  // default: 10MB per buffer * 3 buffers = 30MB total
  byteLength = 1e7,

  buffers: SharedArrayBuffer[] = [
    new SharedArrayBuffer(byteLength),
    new SharedArrayBuffer(byteLength),
    new SharedArrayBuffer(byteLength),
  ],

  byteViews: Uint8Array[] = [new Uint8Array(buffers[0]), new Uint8Array(buffers[1]), new Uint8Array(buffers[2])]
): TripleBuffer => ({ byteLength, buffers, byteViews, flags });

const readyToRead = (flags: number) => {
  return (flags & 0x40) !== 0;
};

const swapReadWithTemp = (flags: number) => {
  return (flags & 0x30) | ((flags & 0x3) << 2) | ((flags & 0xc) >> 2);
};

const swapWriteWithTempAndMarkChanged = (flags: number) => {
  return 0x40 | ((flags & 0xc) << 2) | ((flags & 0x30) >> 2) | (flags & 0x3);
};

export const getReadBufferIndexFromFlags = (flags: Uint8Array) => Atomics.load(flags, 0) & 0x3;
export const getReadBufferIndex = (tb: TripleBuffer) => Atomics.load(tb.flags, 0) & 0x3;
export const getReadBuffer = (tb: TripleBuffer) => tb.buffers[getReadBufferIndex(tb)];
export const getReadView = (tb: TripleBuffer) => tb.byteViews[getReadBufferIndex(tb)];

export const getWriteBufferIndex = (tb: TripleBuffer) => (Atomics.load(tb.flags, 0) & 0x30) >> 4;
export const getWriteBuffer = (tb: TripleBuffer) => tb.buffers[getWriteBufferIndex(tb)];
export const copyToWriteBuffer = (tb: TripleBuffer, byteView: Uint8Array) =>
  tb.byteViews[getWriteBufferIndex(tb)].set(byteView);

export const swapReadBuffer = (tb: TripleBuffer) => {
  const flags = Atomics.load(tb.flags, 0);

  do {
    if (!readyToRead(flags)) {
      return false;
    }
  } while (Atomics.compareExchange(tb.flags, 0, flags, swapReadWithTemp(flags)) === flags);

  return true;
};

export const swapReadBufferFlags = (flags: Uint8Array) => {
  const f = Atomics.load(flags, 0);

  do {
    if (!readyToRead(f)) {
      return false;
    }
  } while (Atomics.compareExchange(flags, 0, f, swapReadWithTemp(f)) === f);

  return true;
};

export const swapWriteBuffer = (tb: TripleBuffer) => {
  const flags = Atomics.load(tb.flags, 0);
  while (Atomics.compareExchange(tb.flags, 0, flags, swapWriteWithTempAndMarkChanged(flags)) === flags);
};

export const swapWriteBufferFlags = (flags: Uint8Array) => {
  const f = Atomics.load(flags, 0);
  while (Atomics.compareExchange(flags, 0, f, swapWriteWithTempAndMarkChanged(f)) === f);
};
