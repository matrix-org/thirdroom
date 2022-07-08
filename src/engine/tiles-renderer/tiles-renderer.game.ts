import { GameState } from "../GameTypes";
import { createResource } from "../resource/resource.game";
import { Thread } from "../module/module.common";
import { TilesRendererResoruceProps, TilesRendererResourceType } from "./tiles-renderer.common";

export interface RemoteTilesRenderer {
  name: string;
  resourceId: number;
  tilesetUrl: string;
}

const DEFAULT_TILES_RENDERER_NAME = "Tiles Renderer";

export interface TilesRendererProps {
  name?: string;
  tilesetUrl: string;
}

export function createRemoteTilesRenderer(ctx: GameState, props: TilesRendererProps): RemoteTilesRenderer {
  const name = props.name || DEFAULT_TILES_RENDERER_NAME;

  return {
    name,
    tilesetUrl: props.tilesetUrl,
    resourceId: createResource<TilesRendererResoruceProps>(
      ctx,
      Thread.Render,
      TilesRendererResourceType,
      {
        tilesetUrl: props.tilesetUrl,
      },
      {
        name,
      }
    ),
  };
}
