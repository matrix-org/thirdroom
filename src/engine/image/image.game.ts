import { GameState } from "../GameTypes";
import { ImageResourceProps, ImageResourceType } from "./image.common";
import { createResource } from "../resource/resource.game";

export type ImageResourceId = number;

export function createImage(ctx: GameState, props: ImageResourceProps): ImageResourceId {
  return createResource(ctx, ImageResourceType, props, props.uri);
}
