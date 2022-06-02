// Ported from https://github.com/padenot/ringbuf.js/blob/main/js/ringbuf.js

import { TypedArray, TypedArrayConstructor } from "../allocator/types";

/**
 * TYPES
 */

export interface RingBuffer<T extends TypedArrayConstructor> {
  _capacity: number;
  buf: SharedArrayBuffer;
  writePtr: Uint32Array;
  readPtr: Uint32Array;
  storage: InstanceType<T>;
}

/**
 * PRIVATE
 */

/**
 * @return Number of elements available for reading, given a read and write
 * pointer.
 * @private
 */
function _availableRead<T extends TypedArrayConstructor>(rb: RingBuffer<T>, rd: number, wr: number) {
  return (wr + _storageCapacity(rb) - rd) % _storageCapacity(rb);
}

/**
 * @return Number of elements available from writing, given a read and write
 * pointer.
 * @private
 */
function _availableWrite<T extends TypedArrayConstructor>(rb: RingBuffer<T>, rd: number, wr: number) {
  return getRingBufferCapacity(rb) - _availableRead(rb, rd, wr);
}

/**
 * @return The size of the storage for elements not accounting the space for
 * the index, counting the empty slot.
 * @private
 */
function _storageCapacity<T extends TypedArrayConstructor>(rb: RingBuffer<T>): number {
  return rb._capacity;
}

/**
 * Copy `size` elements from `input`, starting at offset `offset_input`, to
 * `output`, starting at offset `offset_output`.
 * @param {TypedArray} input The array to copy from
 * @param {Number} offsetInput The index at which to start the copy
 * @param {TypedArray} output The array to copy to
 * @param {Number} offsetOutput The index at which to start copying the elements to
 * @param {Number} size The number of elements to copy
 * @private
 */
function _copy(input: TypedArray, offsetInput: number, output: TypedArray, offsetOutput: number, size: number) {
  for (let i = 0; i < size; i++) {
    output[offsetOutput + i] = input[offsetInput + i];
  }
}

/**
 * PUBLIC
 */

/** The base RingBuffer data structure
 *
 * A Single Producer - Single Consumer thread-safe wait-free ring buffer.
 *
 * The producer and the consumer can be on separate threads, but cannot change roles,
 * except with external synchronization.
 */
export function createRingBuffer<T extends TypedArrayConstructor>(type: T, capacity = 1000): RingBuffer<T> {
  const bytes = 8 + (capacity + 1) * type.BYTES_PER_ELEMENT;
  const buf = new SharedArrayBuffer(bytes);
  const cap = (buf.byteLength - 8) / type.BYTES_PER_ELEMENT;
  // Maximum usable size is 1<<32 - type.BYTES_PER_ELEMENT bytes in the ring
  // buffer for this version, easily changeable.
  // -4 for the write ptr (uint32_t offsets)
  // -4 for the read ptr (uint32_t offsets)
  // capacity counts the empty slot to distinguish between full and empty.
  return {
    buf,
    _capacity: cap,
    writePtr: new Uint32Array(buf, 0, 1),
    readPtr: new Uint32Array(buf, 4, 1),
    storage: new type(buf, 8, cap) as InstanceType<T>,
  };
}

/**
 * @return True if the ring buffer is empty false otherwise. This can be late
 * on the reader side: it can return true even if something has just been
 * pushed.
 */
export function isRingBufferEmpty<T extends TypedArrayConstructor>(rb: RingBuffer<T>) {
  const rd = Atomics.load(rb.readPtr, 0);
  const wr = Atomics.load(rb.writePtr, 0);

  return wr === rd;
}

/**
 * @return True if the ring buffer is full, false otherwise. This can be late
 * on the write side: it can return true when something has just been popped.
 */
export function isRingBufferFull<T extends TypedArrayConstructor>(rb: RingBuffer<T>) {
  const rd = Atomics.load(rb.readPtr, 0);
  const wr = Atomics.load(rb.writePtr, 0);

  return (wr + 1) % _storageCapacity(rb) === rd;
}

/**
 * @return The usable capacity for the ring buffer: the number of elements
 * that can be stored.
 */
export function getRingBufferCapacity<T extends TypedArrayConstructor>(rb: RingBuffer<T>) {
  return rb._capacity - 1;
}

/**
 * @return The number of elements available for reading. This can be late, and
 * report less elements that is actually in the queue, when something has just
 * been enqueued.
 */
export function availableRead<T extends TypedArrayConstructor>(rb: RingBuffer<T>) {
  const rd = Atomics.load(rb.readPtr, 0);
  const wr = Atomics.load(rb.writePtr, 0);
  return _availableRead(rb, rd, wr);
}

/**
 * @return The number of elements available for writing. This can be late, and
 * report less elements that is actually available for writing, when something
 * has just been dequeued.
 */
export function availableWrite<T extends TypedArrayConstructor>(rb: RingBuffer<T>) {
  const rd = Atomics.load(rb.readPtr, 0);
  const wr = Atomics.load(rb.writePtr, 0);
  return _availableWrite(rb, rd, wr);
}

/**
 * Push elements to the ring buffer.
 * @param {TypedArray} elements A typed array of the same type as passed in the ctor, to be written to the queue.
 * @param {Number} length If passed, the maximum number of elements to push.
 * If not passed, all elements in the input array are pushed.
 * @param {Number} offset If passed, a starting index in elements from which
 * the elements are read. If not passed, elements are read from index 0.
 * @return the number of elements written to the queue.
 */
export function pushRingBuffer<T extends TypedArrayConstructor>(
  rb: RingBuffer<T>,
  elements: TypedArray,
  length: number | undefined,
  offset = 0
): number {
  const rd = Atomics.load(rb.readPtr, 0);
  const wr = Atomics.load(rb.writePtr, 0);

  if ((wr + 1) % _storageCapacity(rb) === rd) {
    // full
    return 0;
  }

  const len = length !== undefined ? length : elements.length;

  const toWrite = Math.min(_availableWrite(rb, rd, wr), len);
  const firstPart = Math.min(_storageCapacity(rb) - wr, toWrite);
  const secondPart = toWrite - firstPart;

  _copy(elements, offset, rb.storage, wr, firstPart);
  _copy(elements, offset + firstPart, rb.storage, 0, secondPart);

  // publish the enqueued data to the other side
  Atomics.store(rb.writePtr, 0, (wr + toWrite) % _storageCapacity(rb));

  return toWrite;
}

/**
 * Read up to `elements.length` elements from the ring buffer. `elements` is a typed
 * array of the same type as passed in the ctor.
 * Returns the number of elements read from the queue, they are placed at the
 * beginning of the array passed as parameter.
 * @param {TypedArray} elements An array in which the elements read from the
 * queue will be written, starting at the beginning of the array.
 * @param {Number} length If passed, the maximum number of elements to pop. If
 * not passed, up to elements.length are popped.
 * @param {Number} offset If passed, an index in elements in which the data is
 * written to. `elements.length - offset` must be greater or equal to
 * `length`.
 * @return The number of elements read from the queue.
 */
export function popRingBuffer<T extends TypedArrayConstructor>(
  rb: RingBuffer<T>,
  elements: TypedArray,
  length: number | undefined,
  offset = 0
) {
  const rd = Atomics.load(rb.readPtr, 0);
  const wr = Atomics.load(rb.writePtr, 0);

  if (wr === rd) {
    return 0;
  }

  const len = length !== undefined ? length : elements.length;
  const toRead = Math.min(_availableRead(rb, rd, wr), len);

  const firstPart = Math.min(_storageCapacity(rb) - rd, toRead);
  const secondPart = toRead - firstPart;

  _copy(rb.storage, rd, elements, offset, firstPart);
  _copy(rb.storage, 0, elements, offset + firstPart, secondPart);

  Atomics.store(rb.readPtr, 0, (rd + toRead) % _storageCapacity(rb));

  return toRead;
}
