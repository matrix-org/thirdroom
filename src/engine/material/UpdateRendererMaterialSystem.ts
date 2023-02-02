import { Texture, DoubleSide, FrontSide, MeshPhysicalMaterial } from "three";

import { RenderThreadState } from "../renderer/renderer.render";
import { getLocalResources, RenderMaterial, RenderTexture } from "../resource/resource.render";
import { MaterialAlphaMode } from "../resource/schema";
import { PrimitiveMaterial } from "./material.render";

type TextureKeys<Mat extends PrimitiveMaterial> = {
  [Key in keyof Mat]: Mat[Key] extends Texture | null ? Key : never;
}[keyof Mat];

function updateMaterialTexture<Mat extends PrimitiveMaterial>(
  material: Mat,
  key: TextureKeys<Mat>,
  value: RenderTexture | undefined,
  offset: Float32Array,
  rotation: number,
  scale: Float32Array
) {
  if (!!material[key] !== !!value) {
    material.needsUpdate = true;
  }

  const texture = ((material[key] as Texture | null) = value?.texture || null);

  if (texture) {
    texture.offset.fromArray(offset);
    texture.rotation = rotation;
    texture.repeat.fromArray(scale);
  }
}

export function UpdateRendererMaterialSystem(ctx: RenderThreadState) {
  const localMaterials = getLocalResources(ctx, RenderMaterial);

  for (let i = 0; i < localMaterials.length; i++) {
    const localMaterial = localMaterials[i];
    const materialCache = localMaterial.materialCache;

    for (let j = 0; j < materialCache.length; j++) {
      const { useDerivativeTangents, material } = materialCache[j];

      if (!("isMatrixMaterial" in material)) {
        material.color.fromArray(localMaterial.baseColorFactor);
      }

      material.opacity = localMaterial.baseColorFactor[3];
      material.side = localMaterial.doubleSided ? DoubleSide : FrontSide;
      material.transparent = localMaterial.alphaMode === MaterialAlphaMode.BLEND;
      material.depthWrite = localMaterial.alphaMode !== MaterialAlphaMode.BLEND;
      material.alphaTest = localMaterial.alphaMode === MaterialAlphaMode.MASK ? localMaterial.alphaCutoff : 0;

      if ("map" in material) {
        updateMaterialTexture(
          material,
          "map",
          localMaterial.baseColorTexture,
          localMaterial.baseColorTextureOffset,
          localMaterial.baseColorTextureRotation,
          localMaterial.baseColorTextureScale
        );
      }

      if ("isMeshStandardMaterial" in material) {
        material.metalness = localMaterial.metallicFactor; // 🤘
        updateMaterialTexture(
          material,
          "metalnessMap",
          localMaterial.metallicRoughnessTexture,
          localMaterial.metallicRoughnessTextureOffset,
          localMaterial.metallicRoughnessTextureRotation,
          localMaterial.metallicRoughnessTextureScale
        );
        material.roughness = localMaterial.roughnessFactor;
        updateMaterialTexture(
          material,
          "roughnessMap",
          localMaterial.metallicRoughnessTexture,
          localMaterial.metallicRoughnessTextureOffset,
          localMaterial.metallicRoughnessTextureRotation,
          localMaterial.metallicRoughnessTextureScale
        );
        material.normalScale.set(
          localMaterial.normalScale,
          useDerivativeTangents ? -localMaterial.normalScale : localMaterial.normalScale
        );
        updateMaterialTexture(
          material,
          "normalMap",
          localMaterial.normalTexture,
          localMaterial.normalTextureOffset,
          localMaterial.normalTextureRotation,
          localMaterial.normalTextureScale
        );
        material.aoMapIntensity = localMaterial.occlusionTextureStrength;
        updateMaterialTexture(
          material,
          "aoMap",
          localMaterial.occlusionTexture,
          localMaterial.occlusionTextureOffset,
          localMaterial.occlusionTextureRotation,
          localMaterial.occlusionTextureScale
        );
        material.emissive.fromArray(localMaterial.emissiveFactor);
        material.emissiveIntensity = localMaterial.emissiveStrength;
        updateMaterialTexture(
          material,
          "emissiveMap",
          localMaterial.emissiveTexture,
          localMaterial.emissiveTextureOffset,
          localMaterial.emissiveTextureRotation,
          localMaterial.emissiveTextureScale
        );
      }

      if ("isMeshPhysicalMaterial" in material) {
        // TODO: add isMeshPhysicalMaterial to MeshPhysicalMaterial types
        const physicalMaterial = material as MeshPhysicalMaterial;
        physicalMaterial.ior = localMaterial.ior;
        physicalMaterial.thickness = localMaterial.thicknessFactor;
        physicalMaterial.attenuationDistance = localMaterial.attenuationDistance;
        physicalMaterial.attenuationColor.fromArray(localMaterial.attenuationColor);
        physicalMaterial.transmission = localMaterial.transmissionFactor;
        updateMaterialTexture(
          physicalMaterial,
          "transmissionMap",
          localMaterial.transmissionTexture,
          localMaterial.transmissionTextureOffset,
          localMaterial.transmissionTextureRotation,
          localMaterial.transmissionTextureScale
        );
        updateMaterialTexture(
          physicalMaterial,
          "thicknessMap",
          localMaterial.thicknessTexture,
          localMaterial.thicknessTextureOffset,
          localMaterial.thicknessTextureRotation,
          localMaterial.thicknessTextureScale
        );
      }
    }
  }
}
