import {
  Color,
  DoubleSide,
  FrontSide,
  LineBasicMaterial,
  Material,
  MaterialParameters,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointsMaterial,
  Vector2,
} from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { MeshAttribute, MeshMode } from "../mesh/mesh.common";
import { LocalMeshPrimitive } from "../mesh/mesh.render";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, waitForLocalResource } from "../resource/resource.render";
import { LocalTextureResource } from "../texture/texture.render";
import { promiseObject } from "../utils/promiseObject";
import {
  SharedUnlitMaterial,
  MaterialType,
  SharedStandardMaterial,
  SharedUnlitMaterialResource,
  MaterialAlphaMode,
  SharedStandardMaterialResource,
} from "./material.common";

/* Local Resource Types */

export interface LocalUnlitMaterialResource {
  resourceId: number;
  type: MaterialType.Unlit;
  baseColorTexture?: LocalTextureResource;
  sharedMaterial: SharedUnlitMaterial;
}

export interface LocalStandardMaterialResource {
  resourceId: number;
  type: MaterialType.Standard;
  baseColorTexture?: LocalTextureResource;
  metallicRoughnessTexture?: LocalTextureResource;
  normalTexture?: LocalTextureResource;
  occlusionTexture?: LocalTextureResource;
  emissiveTexture?: LocalTextureResource;
  sharedMaterial: SharedStandardMaterial;
}

export type LocalMaterialResource = LocalUnlitMaterialResource | LocalStandardMaterialResource;

/* Resource Loaders */

export async function onLoadLocalUnlitMaterialResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { type, initialProps, sharedMaterial }: SharedUnlitMaterialResource
): Promise<LocalUnlitMaterialResource> {
  const rendererModule = getModule(ctx, RendererModule);

  let baseColorTexture: LocalTextureResource | undefined;

  if (initialProps.baseColorTexture) {
    baseColorTexture = await waitForLocalResource<LocalTextureResource>(ctx, initialProps.baseColorTexture);
  }

  const localUnlitMaterial: LocalUnlitMaterialResource = {
    resourceId,
    type,
    baseColorTexture,
    sharedMaterial,
  };

  rendererModule.unlitMaterials.push(localUnlitMaterial);

  return localUnlitMaterial;
}

export async function onLoadLocalStandardMaterialResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { type, initialProps, sharedMaterial }: SharedStandardMaterialResource
): Promise<LocalStandardMaterialResource> {
  const rendererModule = getModule(ctx, RendererModule);

  const textures = await promiseObject({
    baseColorTexture: initialProps.baseColorTexture
      ? waitForLocalResource<LocalTextureResource>(ctx, initialProps.baseColorTexture)
      : undefined,
    metallicRoughnessTexture: initialProps.metallicRoughnessTexture
      ? waitForLocalResource<LocalTextureResource>(ctx, initialProps.metallicRoughnessTexture)
      : undefined,
    normalTexture: initialProps.normalTexture
      ? waitForLocalResource<LocalTextureResource>(ctx, initialProps.normalTexture)
      : undefined,
    occlusionTexture: initialProps.occlusionTexture
      ? waitForLocalResource<LocalTextureResource>(ctx, initialProps.occlusionTexture)
      : undefined,
    emissiveTexture: initialProps.emissiveTexture
      ? waitForLocalResource<LocalTextureResource>(ctx, initialProps.emissiveTexture)
      : undefined,
  });

  const localMaterialResource: LocalStandardMaterialResource = {
    resourceId,
    type,
    ...textures,
    sharedMaterial,
  };

  rendererModule.standardMaterials.push(localMaterialResource);

  return localMaterialResource;
}

/* Material factories (Used in mesh.renderer.ts) */

export function createPrimitiveUnlitMaterial(
  primitive: LocalMeshPrimitive,
  material: LocalUnlitMaterialResource
): Material {
  const { mode } = primitive;
  const baseParameters = getLocalMaterialBaseParameters(primitive, material);
  const color = new Color().fromArray(material.sharedMaterial.baseColorFactor);

  if (mode === MeshMode.TRIANGLES || mode === MeshMode.TRIANGLE_FAN || mode === MeshMode.TRIANGLE_STRIP) {
    return new MeshBasicMaterial({
      ...baseParameters,
      color,
      map: material.baseColorTexture?.texture,
    });
  } else if (mode === MeshMode.LINES || mode === MeshMode.LINE_STRIP || mode === MeshMode.LINE_LOOP) {
    return new LineBasicMaterial({ ...baseParameters, color });
  } else if (mode === MeshMode.POINTS) {
    return new PointsMaterial({
      ...baseParameters,
      map: material.baseColorTexture?.texture,
      sizeAttenuation: false,
    });
  }

  throw new Error(`Unsupported mesh mode ${mode}`);
}

export function createPrimitiveStandardMaterial(
  primitive: LocalMeshPrimitive,
  materialResource: LocalStandardMaterialResource
): Material {
  const {
    sharedMaterial,
    baseColorTexture,
    metallicRoughnessTexture,
    occlusionTexture,
    emissiveTexture,
    normalTexture,
  } = materialResource;
  const { mode } = primitive;
  const baseParameters = getLocalMaterialBaseParameters(primitive, materialResource);
  const color = new Color().fromArray(sharedMaterial.baseColorFactor);

  if (mode === MeshMode.TRIANGLES || mode === MeshMode.TRIANGLE_FAN || mode === MeshMode.TRIANGLE_STRIP) {
    return new MeshStandardMaterial({
      ...baseParameters,
      color,
      map: baseColorTexture?.texture,
      metalnessMap: metallicRoughnessTexture?.texture,
      roughnessMap: metallicRoughnessTexture?.texture,
      aoMap: occlusionTexture?.texture,
      emissiveMap: emissiveTexture?.texture,
      normalMap: normalTexture?.texture,
      metalness: sharedMaterial.metallicFactor[0],
      roughness: sharedMaterial.roughnessFactor[0],
      normalScale: new Vector2().setScalar(sharedMaterial.normalTextureScale[0]),
      aoMapIntensity: sharedMaterial.occlusionTextureStrength[0],
      emissive: new Color().fromArray(sharedMaterial.emissiveFactor),
      flatShading: !(MeshAttribute.NORMAL in primitive.attributes),
    });
  } else if (mode === MeshMode.LINES || mode === MeshMode.LINE_STRIP || mode === MeshMode.LINE_LOOP) {
    return new LineBasicMaterial({ ...baseParameters, color });
  } else if (mode === MeshMode.POINTS) {
    return new PointsMaterial({
      ...baseParameters,
      color,
      map: baseColorTexture?.texture,
      sizeAttenuation: false,
    });
  }

  throw new Error(`Unsupported mesh mode ${mode}`);
}

function getLocalMaterialBaseParameters(
  primitive: LocalMeshPrimitive,
  material: LocalMaterialResource
): MaterialParameters {
  const baseParameters: MaterialParameters = {
    opacity: material.sharedMaterial.baseColorFactor[3],
    side: material.sharedMaterial.doubleSided[0] ? DoubleSide : FrontSide,
    transparent: material.sharedMaterial.alphaMode[0] === MaterialAlphaMode.BLEND,
    depthWrite: material.sharedMaterial.alphaMode[0] !== MaterialAlphaMode.BLEND,
    alphaTest:
      material.sharedMaterial.alphaMode[0] === MaterialAlphaMode.MASK
        ? material.sharedMaterial.alphaCutoff[0]
        : undefined,
    vertexColors: MeshAttribute.COLOR_0 in primitive.attributes,
  };

  return baseParameters;
}

/* Local material update systems (Used in renderer.renderer.ts) */

export function updateLocalUnlitMaterialResources(
  ctx: RenderThreadState,
  unlitMaterials: LocalUnlitMaterialResource[]
) {
  for (let i = 0; i < unlitMaterials.length; i++) {
    const unlitMaterial = unlitMaterials[i];
    const sharedMaterial = getReadObjectBufferView(unlitMaterial.sharedMaterial);

    updateSharedTextureResource(ctx, unlitMaterial, sharedMaterial, "baseColorTexture");
  }
}

export function updateLocalStandardMaterialResources(
  ctx: RenderThreadState,
  standardMaterials: LocalStandardMaterialResource[]
) {
  for (let i = 0; i < standardMaterials.length; i++) {
    const standardMaterial = standardMaterials[i];
    const sharedMaterial = getReadObjectBufferView(standardMaterial.sharedMaterial);

    updateSharedTextureResource(ctx, standardMaterial, sharedMaterial, "baseColorTexture");
    updateSharedTextureResource(ctx, standardMaterial, sharedMaterial, "metallicRoughnessTexture");
    updateSharedTextureResource(ctx, standardMaterial, sharedMaterial, "occlusionTexture");
    updateSharedTextureResource(ctx, standardMaterial, sharedMaterial, "emissiveTexture");
    updateSharedTextureResource(ctx, standardMaterial, sharedMaterial, "normalTexture");
  }
}

function updateSharedTextureResource<Resource extends LocalMaterialResource>(
  ctx: RenderThreadState,
  materialResource: Resource,
  currentSharedMaterial: Resource["sharedMaterial"]["views"][number],
  mapName: keyof Resource
) {
  const anyMaterialResource = materialResource as any;
  const anyCurrentSharedMaterial = currentSharedMaterial as any;

  if (anyCurrentSharedMaterial[mapName][0] !== (anyMaterialResource[mapName]?.resourceId || 0)) {
    const textureResource = getLocalResource<LocalTextureResource>(ctx, anyCurrentSharedMaterial[mapName][0]);
    anyMaterialResource[mapName] = textureResource?.resource;
  }
}

/* Local material update functions (Used in mesh.renderer.ts) */

export function updatePrimitiveUnlitMaterial(
  material: MeshBasicMaterial | LineBasicMaterial | PointsMaterial,
  materialResource: LocalUnlitMaterialResource
) {
  const sharedMaterial = materialResource.sharedMaterial;

  updatePrimitiveBaseMaterial(material, sharedMaterial);

  if ("map" in material) {
    material.map = materialResource.baseColorTexture?.texture || null;
  }
}

export function updatePrimitiveStandardMaterial(
  material: MeshStandardMaterial | LineBasicMaterial | PointsMaterial,
  materialResource: LocalStandardMaterialResource
) {
  const sharedMaterial = materialResource.sharedMaterial;

  updatePrimitiveBaseMaterial(material, sharedMaterial);

  if ("isMeshStandardMaterial" in material) {
    material.metalness = sharedMaterial.metallicFactor[0]; // 🤘
    material.roughness = sharedMaterial.roughnessFactor[0];
    material.normalScale.setScalar(sharedMaterial.normalTextureScale[0]);
    material.aoMapIntensity = sharedMaterial.occlusionTextureStrength[0];
    material.emissive.fromArray(sharedMaterial.emissiveFactor);
  }
}

function updatePrimitiveBaseMaterial(
  material: MeshStandardMaterial | MeshBasicMaterial | LineBasicMaterial | PointsMaterial,
  sharedMaterial: SharedUnlitMaterial | SharedStandardMaterial
) {
  material.color.fromArray(sharedMaterial.baseColorFactor);
  material.opacity = sharedMaterial.baseColorFactor[3];
  material.side = sharedMaterial.doubleSided[0] ? DoubleSide : FrontSide;
  material.transparent = sharedMaterial.alphaMode[0] === MaterialAlphaMode.BLEND;
  material.depthWrite = sharedMaterial.alphaMode[0] !== MaterialAlphaMode.BLEND;
  material.alphaTest = sharedMaterial.alphaMode[0] === MaterialAlphaMode.MASK ? sharedMaterial.alphaCutoff[0] : 0;
}
