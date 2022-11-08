import { GLTFTexture } from "./GLTF";
import { GLTFResource, loadGLTFImage } from "./gltf.game";

export function hasBasisuExtension(property: GLTFTexture) {
  return property.extensions?.KHR_texture_basisu !== undefined;
}

export function loadBasisuImage(resource: GLTFResource, property: GLTFTexture) {
  return loadGLTFImage(resource, property.extensions!.KHR_texture_basisu!.source);
}
