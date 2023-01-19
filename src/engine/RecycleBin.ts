import { removeEntity } from "bitecs";

import { World } from "./GameTypes";
import { addHistory, trimHistorian, Historian, createHistorian } from "./utils/Historian";
import { obtainFromPool, releaseToPool, Pool, createPool } from "./utils/Pool";

export type RecycleBin = number[];

export interface RecycleBinContext {
  active: RecycleBin;
  pool: Pool<RecycleBin>;
  historian: Historian<RecycleBin>;
}

export function createRecycleBinContext(): RecycleBinContext {
  const pool = createPool<RecycleBin>(
    () => [],
    (item) => (item.length = 0)
  );

  return {
    active: obtainFromPool(pool),
    pool,
    historian: createHistorian<RecycleBin>(),
  };
}

export function recycleEntity(recycleCtx: RecycleBinContext, eid: number) {
  recycleCtx.active.push(eid);
}

export function recycleBinNextTick(recycleCtx: RecycleBinContext, tick: number) {
  addHistory(recycleCtx.historian, tick, recycleCtx.active);
  recycleCtx.active = obtainFromPool(recycleCtx.pool);
}

export function recycleBinReleaseEntities(
  recycleCtx: RecycleBinContext,
  world: World,
  lastProcessedTick: number,
  removeEntityFn: (world: World, eid: number) => void = removeEntity
) {
  const trimmed = trimHistorian(recycleCtx.historian, lastProcessedTick);

  trimmed.forEach((bin) => {
    // give EIDs back to bitecs so they are made available for internal recycling
    for (let i = 0; i < bin.length; i++) {
      const eid = bin[i];
      removeEntityFn(world, eid);
    }
    releaseToPool(recycleCtx.pool, bin);
  });
}
