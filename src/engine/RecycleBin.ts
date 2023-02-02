import { addHistory, trimHistory, Historian, createHistorian } from "./utils/Historian";
import { obtainFromPool, releaseToPool, Pool, createPool } from "./utils/Pool";

export type RecycleBin<T> = T[];

export interface RecycleBinContext<T> {
  active: RecycleBin<T>;
  pool: Pool<RecycleBin<T>>;
  historian: Historian<RecycleBin<T>>;
}

export function createRecycleBinContext<T>(): RecycleBinContext<T> {
  const pool = createPool<RecycleBin<T>>(
    () => [],
    (item) => (item.length = 0)
  );

  return {
    active: obtainFromPool(pool),
    pool,
    historian: createHistorian<RecycleBin<T>>(),
  };
}

export function addToRecycleBin<T>(recycleCtx: RecycleBinContext<T>, item: T) {
  recycleCtx.active.push(item);
}

export function recycleBinNext<T>(recycleCtx: RecycleBinContext<T>, time: number) {
  addHistory(recycleCtx.historian, time, recycleCtx.active);
  recycleCtx.active = obtainFromPool(recycleCtx.pool);
}

export function recycleBinRelease<T>(
  recycleCtx: RecycleBinContext<T>,
  lastProcessedTime: number,
  cb: (bin: RecycleBin<T>) => void
) {
  const trimmed = trimHistory(recycleCtx.historian, lastProcessedTime);

  trimmed.forEach((bin) => {
    if (cb) cb(bin);
    releaseToPool(recycleCtx.pool, bin);
  });
}
