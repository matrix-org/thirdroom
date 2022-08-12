export interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: any): void;
}

export function createDeferred<T>(timeout: number | false = 30000, timeoutMessage?: string): Deferred<T> {
  const deferred: any = {};

  deferred.promise = new Promise<T>((resolve, reject) => {
    let timeoutId: number;

    if (timeout !== false) {
      timeoutId = self.setTimeout(() => {
        reject(new Error(timeoutMessage || "Deferred timed out"));
      }, timeout);
    }

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
