export interface AtomicCounter {
  buffer: SharedArrayBuffer;
  view: Uint32Array;
}

export function createAtomicCounter(initialValue = 0): AtomicCounter {
  const buffer = new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT);
  const view = new Uint32Array(buffer);

  view[0] = initialValue;

  return {
    buffer,
    view,
  };
}

export function incrementCounter(counter: AtomicCounter) {
  return Atomics.add(counter.view, 0, 1);
}

export function decrementCounter(counter: AtomicCounter) {
  return Atomics.sub(counter.view, 0, 1);
}

export function addCounter(counter: AtomicCounter, value: number) {
  return Atomics.add(counter.view, 0, value);
}

export function subtractCounter(counter: AtomicCounter, value: number) {
  return Atomics.sub(counter.view, 0, value);
}
