export const waitUntil = <T>(fn: Function, ms = 100): T =>
  fn()
    ? fn()
    : new Promise<T>((resolve) => {
        const interval = setInterval(() => {
          const result = fn();
          if (result) {
            clearInterval(interval);
            resolve(result);
          }
        }, ms);
      });
