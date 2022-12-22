import { Texture, DoubleSide, FrontSide, MeshPhysicalMaterial } from "three";

import { RenderThreadState } from "../renderer/renderer.render";
import { getLocalResources } from "../resource/resource.render";
import { MaterialAlphaMode } from "../resource/schema";
import { RendererTextureResource } from "../texture/texture.render";
import { PrimitiveMaterial, RendererMaterialResource } from "./material.render";

type TextureKeys<Mat extends PrimitiveMaterial> = {
  [Key in keyof Mat]: Mat[Key] extends Texture | null ? Key : never;
}[keyof Mat];

function updateMaterialTexture<Mat extends PrimitiveMaterial>(
  material: Mat,
  key: TextureKeys<Mat>,
  value: RendererTextureResource | undefined
) {
  if (!!material[key] !== !!value) {
    material.needsUpdate = true;
  }

  (material[key] as Texture | null) = value?.texture || null;
}

export function UpdateRendererMaterialSystem(ctx: RenderThreadState) {
  const localMaterials = getLocalResources(ctx, RendererMaterialResource);

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
        updateMaterialTexture(material, "map", localMaterial.baseColorTexture);
      }

      if ("isMeshStandardMaterial" in material) {
        material.metalness = localMaterial.metallicFactor; // 🤘
        updateMaterialTexture(material, "metalnessMap", localMaterial.metallicRoughnessTexture);
        material.roughness = localMaterial.roughnessFactor;
        updateMaterialTexture(material, "roughnessMap", localMaterial.metallicRoughnessTexture);
        material.normalScale.set(
          localMaterial.normalTextureScale,
          useDerivativeTangents ? -localMaterial.normalTextureScale : localMaterial.normalTextureScale
        );
        updateMaterialTexture(material, "normalMap", localMaterial.normalTexture);
        material.aoMapIntensity = localMaterial.occlusionTextureStrength;
        updateMaterialTexture(material, "aoMap", localMaterial.occlusionTexture);
        material.emissive.fromArray(localMaterial.emissiveFactor);
        material.emissiveIntensity = localMaterial.emissiveStrength;
        updateMaterialTexture(material, "emissiveMap", localMaterial.emissiveTexture);
      }

      if ("isMeshPhysicalMaterial" in material) {
        // TODO: add isMeshPhysicalMaterial to MeshPhysicalMaterial types
        const physicalMaterial = material as MeshPhysicalMaterial;
        physicalMaterial.ior = localMaterial.ior;
        physicalMaterial.thickness = localMaterial.thicknessFactor;
        physicalMaterial.attenuationDistance = localMaterial.attenuationDistance;
        physicalMaterial.attenuationColor.fromArray(localMaterial.attenuationColor);
        physicalMaterial.transmission = localMaterial.transmissionFactor;
        updateMaterialTexture(physicalMaterial, "transmissionMap", localMaterial.transmissionTexture);
        updateMaterialTexture(physicalMaterial, "thicknessMap", localMaterial.thicknessTexture);
      }
    }
  }
}
