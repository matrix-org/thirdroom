import { GameState } from "../GameTypes";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import {
  RGBETextureResourceProps,
  RGBETextureResourceType,
  TextureResourceProps,
  TextureResourceType,
} from "./texture.common";

export function createTexture(ctx: GameState, props: TextureResourceProps): ResourceId {
  return createResource(ctx, TextureResourceType, props);
}

export function createRGBETexture(ctx: GameState, props: RGBETextureResourceProps): ResourceId {
  return createResource(ctx, RGBETextureResourceType, props);
}
