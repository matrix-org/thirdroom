import { GameState } from "../GameTypes";
import { createResource } from "../resource/resource.game";
import { Thread } from "../module/module.common";
import { TilesRendererResoruceProps, TilesRendererResourceType } from "./tiles-renderer.common";

export interface RemoteTilesRenderer {
  resourceId: number;
  tilesetUrl: string;
}

export function createRemoteTilesRenderer(ctx: GameState, tilesetUrl: string): RemoteTilesRenderer {
  return {
    tilesetUrl,
    resourceId: createResource<TilesRendererResoruceProps>(ctx, Thread.Render, TilesRendererResourceType, {
      tilesetUrl,
    }),
  };
}
