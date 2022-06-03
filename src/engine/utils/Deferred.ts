export interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: any): void;
}

export function createDeferred<T>(): Deferred<T> {
  const deferred: any = {};

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}
