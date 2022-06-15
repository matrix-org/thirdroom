export interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: any): void;
}

export function createDeferred<T>(timeout = 3000): Deferred<T> {
  const deferred: any = {};

  deferred.promise = new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Deferred timed out"));
    }, timeout);

    deferred.resolve = (value: T) => {
      clearTimeout(timeoutId);
      resolve(value);
    };
    deferred.reject = (error: Error) => {
      clearTimeout(timeoutId);
      reject(error);
    };
  });

  return deferred;
}
