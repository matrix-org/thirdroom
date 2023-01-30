export interface Pool<T> {
  free: T[];
  create: Function;
  dispose?: Function;
}

export const createPool = <T>(create: () => T, dispose: (item: T) => void): Pool<T> => ({
  create,
  dispose,
  free: [],
});

export const obtainFromPool = <T>(pool: Pool<T>) => {
  if (pool.free.length) return pool.free.shift();
  return pool.create();
};

export const releaseToPool = <T>(pool: Pool<T>, item: T) => {
  if (pool.dispose) pool.dispose(item);
  pool.free.push(item);
};
