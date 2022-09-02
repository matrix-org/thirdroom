import { vec3 } from "gl-matrix";

import { GLTFMaterial, GLTFTextureInfo } from "./GLTF";

interface VolumeMaterialProperties {
  thicknessFactor?: number;
  attenuationDistance?: number;
  attenuationColor?: vec3;
}

export function getVolumeMaterialProperties(material: GLTFMaterial): VolumeMaterialProperties {
  const extension = material.extensions?.KHR_materials_volume;

  if (!extension) {
    return {};
  }

  return {
    thicknessFactor: extension.thicknessFactor,
    attenuationDistance: extension.attenuationDistance,
    attenuationColor: extension.attenuationColor,
  };
}

export function getThicknessTextureInfo(material: GLTFMaterial): GLTFTextureInfo | undefined {
  return material.extensions?.KHR_materials_volume?.thicknessTexture;
}
