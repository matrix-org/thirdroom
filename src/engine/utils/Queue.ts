export type Queue<T> = Array<T> & {
  enqueue: (item: T) => number;
  dequeue: () => T | undefined;
};

export function enqueue<T>(queue: Queue<T>, item: T): number {
  return queue.unshift(item);
}

export function dequeue<T>(queue: Queue<T>): T | undefined {
  return queue.pop();
}

export function createQueue<T>(): Queue<T> {
  const queue = [] as Array<T> as Queue<T>;
  Object.defineProperties(queue, {
    enqueue: { value: (item: T) => enqueue(queue, item) },
    dequeue: { value: () => dequeue(queue) },
  });
  return queue;
}
