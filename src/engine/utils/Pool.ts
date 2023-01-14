export interface Pool<T> {
  free: T[];
  constructor: Function;
}

export const createPool = <T>(constructor: () => T): Pool<T> => ({
  constructor,
  free: [],
});

export const obtainFromPool = <T>(pool: Pool<T>) => {
  if (pool.free.length) return pool.free.shift();
  return pool.constructor();
};

export const releaseToPool = <T>(pool: Pool<T>, item: T) => {
  pool.free.push(item);
};
