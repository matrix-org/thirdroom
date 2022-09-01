import { GLTFMaterial } from "./GLTF";

export function getEmissiveStrength(material: GLTFMaterial): number {
  return material.extensions?.KHR_materials_emissive_strength?.emissiveStrength || 1;
}
