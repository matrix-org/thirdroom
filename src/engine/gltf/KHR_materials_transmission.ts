import { GLTFMaterial, GLTFTextureInfo } from "./GLTF";

export function getTransmissionFactor(material: GLTFMaterial): number {
  return material.extensions?.KHR_materials_transmission?.transmissionFactor || 0;
}

export function getTransmissionTextureInfo(material: GLTFMaterial): GLTFTextureInfo | undefined {
  return material.extensions?.KHR_materials_transmission?.transmissionTexture;
}
