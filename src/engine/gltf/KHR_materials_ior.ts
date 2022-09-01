import { GLTFMaterial } from "./GLTF";

export function hasIORExtension(material: GLTFMaterial): boolean {
  return !!material.extensions?.KHR_materials_ior;
}

export function getMaterialIOR(material: GLTFMaterial): number {
  return material.extensions?.KHR_materials_ior?.ior || 1.5;
}
