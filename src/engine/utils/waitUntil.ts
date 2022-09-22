export const waitUntil = (fn: Function, ms = 100) =>
  !fn() &&
  new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (fn()) {
        clearInterval(interval);
        resolve();
      }
    }, ms);
  });
