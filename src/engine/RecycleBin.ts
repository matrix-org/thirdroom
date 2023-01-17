import { removeEntity } from "bitecs";

import { getReadObjectBufferView, getWriteObjectBufferView } from "./allocator/ObjectBufferView";
import { getModule } from "./module/module.common";
import { ResourceModule } from "./resource/resource.game";
import { GameState, World } from "./GameTypes";
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
  const nextBin = obtainFromPool(recycleCtx.pool);
  addHistory(recycleCtx.historian, tick, recycleCtx.active);
  recycleCtx.active = nextBin;
}

export function recycleBinReleaseEntities(recycleCtx: RecycleBinContext, world: World, lastProcessedTick: number) {
  const trimmed = trimHistorian(recycleCtx.historian, lastProcessedTick);

  trimmed.forEach((bin) => {
    // give EIDs back to bitecs so they are made available for internal recycling
    for (let i = 0; i < bin.length; i++) {
      const eid = bin[i];
      console.log("dispose", eid);
      removeEntity(world, eid);
    }
    releaseToPool(recycleCtx.pool, bin);
  });
}

export function NextRecycleBinSystem(ctx: GameState) {
  const resourceModule = getModule(ctx, ResourceModule);
  recycleBinNextTick(resourceModule.recycleBin, ctx.tick);
}

export function SyncRecycleBinSystem(ctx: GameState) {
  const resourceModule = getModule(ctx, ResourceModule);
  const { fromGameState, mainToGameState, renderToGameState, recycleBin } = resourceModule;
  const { tick } = getWriteObjectBufferView(fromGameState);
  const { lastProcessedTick: lastProcessedTickMain } = getReadObjectBufferView(mainToGameState);
  const { lastProcessedTick: lastProcessedTickRender } = getReadObjectBufferView(renderToGameState);

  // Tell Main/Render threads what the game thread's tick is
  tick[0] = ctx.tick;

  // What is the last fully processed tick for both the main and render thread?
  const lastProcessedTick = Math.min(lastProcessedTickMain[0], lastProcessedTickRender[0]);

  // Dispose resources that have been fully removed on the main and render threads
  recycleBinReleaseEntities(recycleBin, ctx.world, lastProcessedTick);
}
