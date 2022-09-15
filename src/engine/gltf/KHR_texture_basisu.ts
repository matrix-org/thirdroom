import { GameState } from "../GameTypes";
import { GLTFTexture } from "./GLTF";
import { GLTFResource, loadGLTFImage } from "./gltf.game";

export function hasBasisuExtension(property: GLTFTexture) {
  return property.extensions?.KHR_texture_basisu !== undefined;
}

export function loadBasisuImage(ctx: GameState, resource: GLTFResource, property: GLTFTexture) {
  return loadGLTFImage(ctx, resource, property.extensions!.KHR_texture_basisu!.source);
}
