export const waitUntil = <T>(fn: Function, ms = 100): Promise<T> => {
  const initialValue = fn();

  return initialValue
    ? Promise.resolve(initialValue)
    : new Promise<T>((resolve) => {
        const interval = setInterval(() => {
          const result = fn();
          if (result) {
            clearInterval(interval);
            resolve(result);
          }
        }, ms);
      });
};
