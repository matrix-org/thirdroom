export const createDisposables = (disposables: Function[]): (() => void) => {
  return () => {
    for (let i = 0; i < disposables.length; i++) {
      const dispose = disposables[i];
      dispose();
    }
  };
};
