import { GameState } from "../GameTypes";
import { ImageResourceProps, ImageResourceType } from "./image.common";
import { createResource } from "../resource/resource.game";

export interface RemoteImage {
  resourceId: number;
  uri?: string;
}

export function createImage(ctx: GameState, props: ImageResourceProps): RemoteImage {
  const resourceId = createResource(ctx, ImageResourceType, props, props.image ? [props.image] : undefined);

  return {
    resourceId,
    uri: props.uri,
  };
}
