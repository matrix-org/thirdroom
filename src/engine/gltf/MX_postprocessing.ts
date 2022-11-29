import { GLTFScene } from "./GLTF";

export function getPostprocessingBloomStrength(property: GLTFScene) {
  return property.extensions?.MX_postprocessing?.bloom?.strength;
}
