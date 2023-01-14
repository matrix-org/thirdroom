import { removeEntity } from "bitecs";

import { getReadObjectBufferView, getWriteObjectBufferView } from "./allocator/ObjectBufferView";
import { getModule } from "./module/module.common";
import { ResourceModule } from "./resource/resource.game";
import { GameState } from "./GameTypes";
import { addHistory, trimHistorian } from "./utils/Historian";
import { obtainFromPool, releaseToPool } from "./utils/Pool";

export type RecycleBin = number[];

export function NextRecycleBinSystem(ctx: GameState) {
  const resourceModule = getModule(ctx, ResourceModule);
  const nextBin = obtainFromPool(resourceModule.recycleBinPool);
  addHistory(resourceModule.recycleBinHistorian, ctx.tick, resourceModule.activeRecycleBin);
  resourceModule.activeRecycleBin = nextBin;
}

export function SyncRecycleBinSystem(ctx: GameState) {
  const resourceModule = getModule(ctx, ResourceModule);
  const { fromGameState, mainToGameState, renderToGameState } = resourceModule;
  const { tick } = getWriteObjectBufferView(fromGameState);
  const { lastProcessedTick: lastProcessedTickMain } = getReadObjectBufferView(mainToGameState);
  const { lastProcessedTick: lastProcessedTickRender } = getReadObjectBufferView(renderToGameState);

  tick[0] = ctx.tick;

  const tickToTrim = Math.min(lastProcessedTickMain[0], lastProcessedTickRender[0]);

  const trimmed = trimHistorian(resourceModule.recycleBinHistorian, tickToTrim);
  trimmed.forEach((bin) => {
    // give EIDs back to bitecs so they are made available for internal recycling
    for (let i = 0; i < bin.length; i++) {
      const eid = bin[i];
      removeEntity(ctx.world, eid);
    }
    bin.length = 0;
    releaseToPool(resourceModule.recycleBinPool, bin);
  });
}
