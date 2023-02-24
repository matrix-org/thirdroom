import { ReadonlyVec3, vec3 } from "gl-matrix";
import {
  FrontSide,
  LineBasicMaterial,
  Matrix3,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PointsMaterial,
  Uniform,
  Vector3,
} from "three";

import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { RenderMaterial, RenderMeshPrimitive } from "../resource/resource.render";
import { MeshPrimitiveAttributeIndex, MeshPrimitiveMode } from "../resource/schema";
import { MatrixMaterial } from "./MatrixMaterial";

export type PrimitiveUnlitMaterial = MeshBasicMaterial | LineBasicMaterial | PointsMaterial;
export type PrimitiveStandardMaterial =
  | MeshStandardMaterial
  | MeshPhysicalMaterial
  | LineBasicMaterial
  | PointsMaterial;
export type PrimitiveMaterial = PrimitiveStandardMaterial | PrimitiveUnlitMaterial | MatrixMaterial;

export interface MaterialCacheEntry {
  mode: MeshPrimitiveMode;
  useDerivativeTangents: boolean;
  vertexColors: boolean;
  flatShading: boolean;
  material: PrimitiveMaterial;
  refCount: number;
}

const defaultMaterialCache: MaterialCacheEntry[] = [];

export const matchMaterial =
  (mode: MeshPrimitiveMode, vertexColors: boolean, flatShading: boolean, useDerivativeTangents: boolean) =>
  (cacheEntry: MaterialCacheEntry) =>
    mode === cacheEntry.mode &&
    vertexColors === cacheEntry.vertexColors &&
    flatShading === cacheEntry.flatShading &&
    useDerivativeTangents === cacheEntry.useDerivativeTangents;

export function getDefaultMaterialForMeshPrimitive(ctx: RenderThreadState, meshPrimitive: RenderMeshPrimitive) {
  const vertexColors = !!meshPrimitive.attributes[MeshPrimitiveAttributeIndex.COLOR_0];
  const flatShading = !meshPrimitive.attributes[MeshPrimitiveAttributeIndex.NORMAL];
  const useDerivativeTangents = !meshPrimitive.attributes[MeshPrimitiveAttributeIndex.TANGENT];

  const cacheEntry = defaultMaterialCache.find(
    matchMaterial(meshPrimitive.mode, vertexColors, flatShading, useDerivativeTangents)
  );

  if (cacheEntry) {
    if (meshPrimitive.materialObj !== cacheEntry.material) {
      cacheEntry.refCount++;
    }

    return cacheEntry.material;
  }

  let material;

  if (meshPrimitive.mode === MeshPrimitiveMode.POINTS) {
    material = new PointsMaterial({
      color: 0xffffff,
    });
  } else if (
    meshPrimitive.mode === MeshPrimitiveMode.LINES ||
    meshPrimitive.mode === MeshPrimitiveMode.LINE_LOOP ||
    meshPrimitive.mode === MeshPrimitiveMode.LINE_STRIP
  ) {
    material = new LineBasicMaterial({
      color: 0xffffff,
    });
  } else {
    material = new MeshStandardMaterial({
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
  }

  defaultMaterialCache.push({
    material,
    flatShading,
    vertexColors,
    mode: meshPrimitive.mode,
    useDerivativeTangents,
    refCount: 1,
  });

  patchMaterial(ctx, material);

  return material;
}

export function patchMaterial(ctx: RenderThreadState, material: PrimitiveMaterial) {
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

const defaultAttenuationColor = vec3.fromValues(1, 1, 1);

export function isPhysicalMaterial(renderMaterial: RenderMaterial) {
  if (
    renderMaterial.transmissionTexture ||
    renderMaterial.thicknessTexture ||
    renderMaterial.ior !== 1.5 ||
    renderMaterial.transmissionFactor !== 0 ||
    renderMaterial.thicknessFactor !== 0 ||
    renderMaterial.attenuationDistance !== 0 ||
    !vec3.equals(renderMaterial.attenuationColor as ReadonlyVec3, defaultAttenuationColor)
  ) {
    return true;
  }

  return false;
}
