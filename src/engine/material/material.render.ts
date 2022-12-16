import { ReadonlyVec3, vec3 } from "gl-matrix";
import {
  Color,
  DoubleSide,
  FrontSide,
  LineBasicMaterial,
  MaterialParameters,
  Matrix3,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PointsMaterial,
  Texture,
  Uniform,
  Vector3,
} from "three";

import { MeshPrimitiveAttribute } from "../mesh/mesh.common";
import { LocalMeshPrimitiveAttributes } from "../mesh/mesh.render";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { getLocalResources } from "../resource/resource.render";
import {
  LocalMaterial,
  MaterialAlphaMode,
  MaterialResource,
  MaterialType,
  MeshPrimitiveMode,
} from "../resource/schema";
import { RendererTextureResource } from "../texture/texture.render";
import { removeUndefinedProperties } from "../utils/removeUndefinedProperties";
import { MatrixMaterial } from "./MatrixMaterial";

export type PrimitiveUnlitMaterial = MeshBasicMaterial | LineBasicMaterial | PointsMaterial;
export type PrimitiveStandardMaterial =
  | MeshStandardMaterial
  | MeshPhysicalMaterial
  | LineBasicMaterial
  | PointsMaterial;
export type PrimitiveMaterial = PrimitiveStandardMaterial | PrimitiveUnlitMaterial | MatrixMaterial;

interface MaterialCacheEntry {
  mode: MeshPrimitiveMode;
  useDerivativeTangents: boolean;
  vertexColors: boolean;
  flatShading: boolean;
  material: PrimitiveMaterial;
  refCount: number;
}

const defaultMaterialCache: MaterialCacheEntry[] = [];

const matchMaterial =
  (mode: MeshPrimitiveMode, vertexColors: boolean, flatShading: boolean, useDerivativeTangents: boolean) =>
  (cacheEntry: MaterialCacheEntry) =>
    mode === cacheEntry.mode &&
    vertexColors === cacheEntry.vertexColors &&
    flatShading === cacheEntry.flatShading &&
    useDerivativeTangents === cacheEntry.useDerivativeTangents;

export function getDefaultMaterialForMeshPrimitive(
  ctx: RenderThreadState,
  mode: MeshPrimitiveMode,
  attributes: LocalMeshPrimitiveAttributes
) {
  const vertexColors = MeshPrimitiveAttribute.COLOR_0 in attributes;
  const flatShading = !(MeshPrimitiveAttribute.NORMAL in attributes);
  const useDerivativeTangents = !(MeshPrimitiveAttribute.TANGENT in attributes);

  const cacheEntry = defaultMaterialCache.find(matchMaterial(mode, vertexColors, flatShading, useDerivativeTangents));

  if (cacheEntry) {
    cacheEntry.refCount++;
    return cacheEntry.material;
  }

  const material = new MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    metalness: 1,
    roughness: 1,
    transparent: false,
    depthTest: true,
    side: FrontSide,
    flatShading,
    vertexColors,
  });

  defaultMaterialCache.push({
    material,
    flatShading,
    vertexColors,
    mode,
    useDerivativeTangents,
    refCount: 1,
  });

  patchMaterial(ctx, material);

  return material;
}

export class RendererMaterialResource extends defineLocalResourceClass<typeof MaterialResource, RenderThreadState>(
  MaterialResource
) {
  declare baseColorTexture: RendererTextureResource | undefined;
  declare metallicRoughnessTexture: RendererTextureResource | undefined;
  declare normalTexture: RendererTextureResource | undefined;
  declare occlusionTexture: RendererTextureResource | undefined;
  declare emissiveTexture: RendererTextureResource | undefined;
  declare transmissionTexture: RendererTextureResource | undefined;
  declare thicknessTexture: RendererTextureResource | undefined;

  materialCache: MaterialCacheEntry[] = [];

  getMaterialForMeshPrimitive(
    ctx: RenderThreadState,
    mode: MeshPrimitiveMode,
    attributes: LocalMeshPrimitiveAttributes
  ): PrimitiveMaterial {
    const vertexColors = MeshPrimitiveAttribute.COLOR_0 in attributes;
    const flatShading = !(MeshPrimitiveAttribute.NORMAL in attributes);
    const useDerivativeTangents = !(MeshPrimitiveAttribute.TANGENT in attributes);

    const cacheEntry = this.materialCache.find(matchMaterial(mode, vertexColors, flatShading, useDerivativeTangents));

    if (cacheEntry) {
      cacheEntry.refCount++;
      return cacheEntry.material;
    }

    let material: PrimitiveMaterial;

    const baseParameters: MaterialParameters = {
      opacity: this.baseColorFactor[3],
      side: this.doubleSided ? DoubleSide : FrontSide,
      transparent: this.alphaMode === MaterialAlphaMode.BLEND,
      depthWrite: this.alphaMode !== MaterialAlphaMode.BLEND,
      alphaTest:
        this.alphaMode === MaterialAlphaMode.MASK
          ? this.alphaCutoff !== undefined
            ? this.alphaCutoff
            : 0.5
          : undefined,
      vertexColors,
    };

    const color = new Color().fromArray(this.baseColorFactor);

    if (this.type === MaterialType.Unlit) {
      if (
        mode === MeshPrimitiveMode.TRIANGLES ||
        mode === MeshPrimitiveMode.TRIANGLE_FAN ||
        mode === MeshPrimitiveMode.TRIANGLE_STRIP
      ) {
        material = new MeshBasicMaterial(
          removeUndefinedProperties({
            ...baseParameters,
            color,
            map: this.baseColorTexture?.texture,
            toneMapped: false,
          })
        );
      } else if (
        mode === MeshPrimitiveMode.LINES ||
        mode === MeshPrimitiveMode.LINE_STRIP ||
        mode === MeshPrimitiveMode.LINE_LOOP
      ) {
        material = new LineBasicMaterial(removeUndefinedProperties({ ...baseParameters, color, toneMapped: false }));
      } else if (mode === MeshPrimitiveMode.POINTS) {
        material = new PointsMaterial(
          removeUndefinedProperties({
            ...baseParameters,
            map: this.baseColorTexture?.texture,
            sizeAttenuation: false,
            toneMapped: false,
          })
        );
      } else {
        throw new Error(`Unsupported mesh mode ${mode}`);
      }
    } else if (this.type === MaterialType.Standard) {
      if (
        mode === MeshPrimitiveMode.TRIANGLES ||
        mode === MeshPrimitiveMode.TRIANGLE_FAN ||
        mode === MeshPrimitiveMode.TRIANGLE_STRIP
      ) {
        if (isPhysicalMaterial(this)) {
          material = new MeshPhysicalMaterial(
            removeUndefinedProperties({
              ...baseParameters,
              color,
              map: this.baseColorTexture?.texture,
              metalnessMap: this.metallicRoughnessTexture?.texture,
              roughnessMap: this.metallicRoughnessTexture?.texture,
              aoMap: this.occlusionTexture?.texture,
              emissiveMap: this.emissiveTexture?.texture,
              normalMap: this.normalTexture?.texture,
              metalness: this.metallicFactor, // 🤘
              roughness: this.roughnessFactor,
              aoMapIntensity: this.occlusionTextureStrength,
              emissive: new Color().fromArray(this.emissiveFactor),
              emissiveIntensity: this.emissiveStrength,
              flatShading,
              ior: this.ior,
              thickness: this.thicknessFactor as any, // TODO: Add thickness to MeshStandardMaterialParameters types
              thicknessMap: this.thicknessTexture?.texture,
              attenuationDistance: this.attenuationDistance,
              attenuationColor: new Color().fromArray(this.attenuationColor),
              transmission: this.transmissionFactor,
              transmissionMap: this.transmissionTexture?.texture,
            })
          );

          material.normalScale.set(
            this.normalTextureScale,
            useDerivativeTangents ? -this.normalTextureScale : this.normalTextureScale
          );
        } else {
          material = new MeshStandardMaterial(
            removeUndefinedProperties({
              ...baseParameters,
              color,
              map: this.baseColorTexture?.texture,
              metalnessMap: this.metallicRoughnessTexture?.texture,
              roughnessMap: this.metallicRoughnessTexture?.texture,
              aoMap: this.occlusionTexture?.texture,
              emissiveMap: this.emissiveTexture?.texture,
              normalMap: this.normalTexture?.texture,
              metalness: this.metallicFactor, // 🤘
              roughness: this.roughnessFactor,
              aoMapIntensity: this.occlusionTextureStrength,
              emissive: new Color().fromArray(this.emissiveFactor),
              emissiveIntensity: this.emissiveStrength,
              flatShading,
            })
          );

          material.normalScale.set(
            this.normalTextureScale,
            useDerivativeTangents ? -this.normalTextureScale : this.normalTextureScale
          );
        }

        patchMaterial(ctx, material);
      } else if (
        mode === MeshPrimitiveMode.LINES ||
        mode === MeshPrimitiveMode.LINE_STRIP ||
        mode === MeshPrimitiveMode.LINE_LOOP
      ) {
        material = new LineBasicMaterial(removeUndefinedProperties({ ...baseParameters, color }));
      } else if (mode === MeshPrimitiveMode.POINTS) {
        material = new PointsMaterial(
          removeUndefinedProperties({
            ...baseParameters,
            color,
            map: this.baseColorTexture?.texture,
            sizeAttenuation: false,
          })
        );
      } else {
        throw new Error(`Unsupported mesh mode ${mode}`);
      }
    } else {
      throw new Error(`Unsupported material type ${this.type}`);
    }

    material.name = this.name;

    this.materialCache.push({
      material,
      flatShading,
      vertexColors,
      mode,
      useDerivativeTangents,
      refCount: 1,
    });

    return material;
  }

  disposeMeshPrimitiveMaterial(material: PrimitiveMaterial) {
    const index = this.materialCache.findIndex((entry) => entry.material === material);

    if (index === -1) {
      return;
    }

    const cacheEntry = this.materialCache[index];

    cacheEntry.refCount--;

    if (cacheEntry.refCount <= 0) {
      material.dispose();
      this.materialCache.splice(index, 1);
    }
  }
}

function patchMaterial(ctx: RenderThreadState, material: PrimitiveMaterial) {
  const rendererModule = getModule(ctx, RendererModule);

  if (!material.defines) {
    material.defines = {};
  }

  if (!("isMeshBasicMaterial" in material)) {
    material.defines.USE_ENVMAP = "";
    material.defines.ENVMAP_MODE_REFLECTION = "";
    material.defines.ENVMAP_TYPE_CUBE_UV = "";
    material.defines.CUBEUV_2D_SAMPLER_ARRAY = "";
    material.defines.ENVMAP_BLENDING_NONE = "";
    material.defines.USE_REFLECTION_PROBES = "";
  }

  if (!material.userData.beforeCompileHook) {
    const lightMapTransform = new Uniform(new Matrix3().setUvTransform(0, 0, 1, 1, 0, 0, 0));
    const reflectionProbesMap = new Uniform(rendererModule.reflectionProbesMap);
    const reflectionProbeParams = new Uniform(new Vector3());
    const reflectionProbeSampleParams = new Uniform(new Vector3());

    material.onBeforeCompile = (shader) => {
      shader.uniforms.lightMapTransform = lightMapTransform;
      shader.uniforms.reflectionProbesMap = reflectionProbesMap;
      shader.uniforms.reflectionProbeParams = reflectionProbeParams;
      shader.uniforms.reflectionProbeSampleParams = reflectionProbeSampleParams;
    };

    material.userData.beforeCompileHook = true;
    material.userData.lightMapTransform = lightMapTransform;
    material.userData.reflectionProbesMap = reflectionProbesMap;
    material.userData.reflectionProbeParams = reflectionProbeParams;
    material.userData.reflectionProbeSampleParams = reflectionProbeSampleParams;

    material.needsUpdate = true;
  }
}

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

const defaultAttenuationColor = vec3.fromValues(1, 1, 1);

function isPhysicalMaterial(localMaterial: LocalMaterial) {
  if (
    localMaterial.transmissionTexture ||
    localMaterial.thicknessTexture ||
    localMaterial.ior !== 1.5 ||
    localMaterial.transmissionFactor !== 0 ||
    localMaterial.thicknessFactor !== 0 ||
    localMaterial.attenuationDistance !== 0 ||
    !vec3.equals(localMaterial.attenuationColor as ReadonlyVec3, defaultAttenuationColor)
  ) {
    return true;
  }

  return false;
}
