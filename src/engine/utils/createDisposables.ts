export const createDisposables = (fns: Function[]): (() => void) => {
  const disposables = fns.map((fn) => fn());
  return () => {
    for (let i = 0; i < disposables.length; i++) {
      const dispose = disposables[i];
      dispose();
    }
  };
};
