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

import { LocalAccessor } from "../accessor/accessor.render";
import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { MeshPrimitiveAttribute, MeshPrimitiveMode } from "../mesh/mesh.common";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, getResourceDisposed, waitForLocalResource } from "../resource/resource.render";
import { LocalTextureResource } from "../texture/texture.render";
import { promiseObject } from "../utils/promiseObject";
import { removeUndefinedProperties } from "../utils/removeUndefinedProperties";
import {
  UnlitMaterialTripleBuffer,
  MaterialType,
  StandardMaterialTripleBuffer,
  SharedUnlitMaterialResource,
  MaterialAlphaMode,
  SharedStandardMaterialResource,
} from "./material.common";

/* Local Resource Types */

export interface LocalUnlitMaterialResource {
  resourceId: number;
  type: MaterialType.Unlit;
  baseColorTexture?: LocalTextureResource;
  materialTripleBuffer: UnlitMaterialTripleBuffer;
}

export interface LocalStandardMaterialResource {
  resourceId: number;
  type: MaterialType.Standard;
  baseColorTexture?: LocalTextureResource;
  metallicRoughnessTexture?: LocalTextureResource;
  normalTexture?: LocalTextureResource;
  occlusionTexture?: LocalTextureResource;
  emissiveTexture?: LocalTextureResource;
  materialTripleBuffer: StandardMaterialTripleBuffer;
}

export type LocalMaterialResource = LocalUnlitMaterialResource | LocalStandardMaterialResource;

export type PrimitiveUnlitMaterial = MeshBasicMaterial | LineBasicMaterial | PointsMaterial;

export type PrimitiveStandardMaterial = MeshStandardMaterial | LineBasicMaterial | PointsMaterial;

export type PrimitiveMaterial = PrimitiveStandardMaterial | PrimitiveUnlitMaterial;

/* Resource Loaders */

export async function onLoadLocalUnlitMaterialResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { type, materialTripleBuffer }: SharedUnlitMaterialResource
): Promise<LocalUnlitMaterialResource> {
  const rendererModule = getModule(ctx, RendererModule);

  let baseColorTexture: LocalTextureResource | undefined;

  const materialView = getReadObjectBufferView(materialTripleBuffer);

  const baseColorTextureResourceId = materialView.baseColorTexture[0];

  if (baseColorTextureResourceId) {
    baseColorTexture = await waitForLocalResource<LocalTextureResource>(ctx, baseColorTextureResourceId);
  }

  const localUnlitMaterial: LocalUnlitMaterialResource = {
    resourceId,
    type,
    baseColorTexture,
    materialTripleBuffer,
  };

  rendererModule.unlitMaterials.push(localUnlitMaterial);

  return localUnlitMaterial;
}

export async function onLoadLocalStandardMaterialResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { type, materialTripleBuffer }: SharedStandardMaterialResource
): Promise<LocalStandardMaterialResource> {
  const rendererModule = getModule(ctx, RendererModule);

  const materialView = getReadObjectBufferView(materialTripleBuffer);

  const baseColorTextureResourceId = materialView.baseColorTexture[0];
  const metallicRoughnessTextureResourceId = materialView.metallicRoughnessTexture[0];
  const normalTextureResourceId = materialView.normalTexture[0];
  const occlusionTextureResourceId = materialView.occlusionTexture[0];
  const emissiveTextureResourceId = materialView.emissiveTexture[0];

  const textures = await promiseObject({
    baseColorTexture: baseColorTextureResourceId
      ? waitForLocalResource<LocalTextureResource>(ctx, baseColorTextureResourceId)
      : undefined,
    metallicRoughnessTexture: metallicRoughnessTextureResourceId
      ? waitForLocalResource<LocalTextureResource>(ctx, metallicRoughnessTextureResourceId)
      : undefined,
    normalTexture: normalTextureResourceId
      ? waitForLocalResource<LocalTextureResource>(ctx, normalTextureResourceId)
      : undefined,
    occlusionTexture: occlusionTextureResourceId
      ? waitForLocalResource<LocalTextureResource>(ctx, occlusionTextureResourceId)
      : undefined,
    emissiveTexture: emissiveTextureResourceId
      ? waitForLocalResource<LocalTextureResource>(ctx, emissiveTextureResourceId)
      : undefined,
  });

  const localMaterialResource: LocalStandardMaterialResource = {
    resourceId,
    type,
    ...textures,
    materialTripleBuffer,
  };

  rendererModule.standardMaterials.push(localMaterialResource);

  return localMaterialResource;
}

/* Material factories (Used in mesh.renderer.ts) */

type PrimitiveAttributes = { [key: string]: LocalAccessor | ResourceId };

export function createDefaultMaterial(attributes: PrimitiveAttributes) {
  return new MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    metalness: 1,
    roughness: 1,
    transparent: false,
    depthTest: true,
    side: FrontSide,
    flatShading: !(MeshPrimitiveAttribute.NORMAL in attributes),
    vertexColors: MeshPrimitiveAttribute.COLOR_0 in attributes,
  });
}

export function createPrimitiveUnlitMaterial(
  mode: MeshPrimitiveMode,
  attributes: PrimitiveAttributes,
  material: LocalUnlitMaterialResource
): Material {
  const materialView = getReadObjectBufferView(material.materialTripleBuffer);

  const baseParameters = getLocalMaterialBaseParameters(attributes, materialView);
  const color = new Color().fromArray(materialView.baseColorFactor);

  if (
    mode === MeshPrimitiveMode.TRIANGLES ||
    mode === MeshPrimitiveMode.TRIANGLE_FAN ||
    mode === MeshPrimitiveMode.TRIANGLE_STRIP
  ) {
    return new MeshBasicMaterial(
      removeUndefinedProperties({
        ...baseParameters,
        color,
        map: material.baseColorTexture?.texture,
      })
    );
  } else if (
    mode === MeshPrimitiveMode.LINES ||
    mode === MeshPrimitiveMode.LINE_STRIP ||
    mode === MeshPrimitiveMode.LINE_LOOP
  ) {
    return new LineBasicMaterial(removeUndefinedProperties({ ...baseParameters, color }));
  } else if (mode === MeshPrimitiveMode.POINTS) {
    return new PointsMaterial(
      removeUndefinedProperties({
        ...baseParameters,
        map: material.baseColorTexture?.texture,
        sizeAttenuation: false,
      })
    );
  }

  throw new Error(`Unsupported mesh mode ${mode}`);
}

export function createPrimitiveStandardMaterial(
  mode: MeshPrimitiveMode,
  attributes: PrimitiveAttributes,
  materialResource: LocalStandardMaterialResource
): Material {
  const {
    materialTripleBuffer,
    baseColorTexture,
    metallicRoughnessTexture,
    occlusionTexture,
    emissiveTexture,
    normalTexture,
  } = materialResource;
  const materialView = getReadObjectBufferView(materialTripleBuffer);
  const baseParameters = getLocalMaterialBaseParameters(attributes, materialView);
  const color = new Color().fromArray(materialView.baseColorFactor);

  if (
    mode === MeshPrimitiveMode.TRIANGLES ||
    mode === MeshPrimitiveMode.TRIANGLE_FAN ||
    mode === MeshPrimitiveMode.TRIANGLE_STRIP
  ) {
    return new MeshStandardMaterial(
      removeUndefinedProperties({
        ...baseParameters,
        color,
        map: baseColorTexture?.texture,
        metalnessMap: metallicRoughnessTexture?.texture,
        roughnessMap: metallicRoughnessTexture?.texture,
        aoMap: occlusionTexture?.texture,
        emissiveMap: emissiveTexture?.texture,
        normalMap: normalTexture?.texture,
        metalness: materialView.metallicFactor[0], // 🤘
        roughness: materialView.roughnessFactor[0],
        normalScale: new Vector2().setScalar(materialView.normalTextureScale[0]),
        aoMapIntensity: materialView.occlusionTextureStrength[0],
        emissive: new Color().fromArray(materialView.emissiveFactor),
        flatShading: !(MeshPrimitiveAttribute.NORMAL in attributes),
      })
    );
  } else if (
    mode === MeshPrimitiveMode.LINES ||
    mode === MeshPrimitiveMode.LINE_STRIP ||
    mode === MeshPrimitiveMode.LINE_LOOP
  ) {
    return new LineBasicMaterial(removeUndefinedProperties({ ...baseParameters, color }));
  } else if (mode === MeshPrimitiveMode.POINTS) {
    return new PointsMaterial(
      removeUndefinedProperties({
        ...baseParameters,
        color,
        map: baseColorTexture?.texture,
        sizeAttenuation: false,
      })
    );
  }

  throw new Error(`Unsupported mesh mode ${mode}`);
}

function getLocalMaterialBaseParameters(
  attributes: PrimitiveAttributes,
  materialView: ReadObjectTripleBufferView<UnlitMaterialTripleBuffer | StandardMaterialTripleBuffer>
): MaterialParameters {
  const baseParameters: MaterialParameters = {
    opacity: materialView.baseColorFactor[3],
    side: materialView.doubleSided[0] ? DoubleSide : FrontSide,
    transparent: materialView.alphaMode[0] === MaterialAlphaMode.BLEND,
    depthWrite: materialView.alphaMode[0] !== MaterialAlphaMode.BLEND,
    alphaTest:
      materialView.alphaMode[0] === MaterialAlphaMode.MASK
        ? materialView.alphaCutoff[0] !== undefined
          ? materialView.alphaCutoff[0]
          : 0.5
        : undefined,
    vertexColors: MeshPrimitiveAttribute.COLOR_0 in attributes,
  };

  return baseParameters;
}

/* Local material update systems (Used in renderer.renderer.ts) */

export function updateLocalUnlitMaterialResources(
  ctx: RenderThreadState,
  unlitMaterials: LocalUnlitMaterialResource[]
) {
  for (let i = unlitMaterials.length - 1; i >= 0; i--) {
    const unlitMaterialResource = unlitMaterials[i];

    if (getResourceDisposed(ctx, unlitMaterialResource.resourceId)) {
      unlitMaterials.splice(i, 1);
    }
  }

  for (let i = 0; i < unlitMaterials.length; i++) {
    const unlitMaterial = unlitMaterials[i];
    const materialView = getReadObjectBufferView(unlitMaterial.materialTripleBuffer);

    updateSharedTextureResource(ctx, unlitMaterial, materialView, "baseColorTexture");
  }
}

export function updateLocalStandardMaterialResources(
  ctx: RenderThreadState,
  standardMaterials: LocalStandardMaterialResource[]
) {
  for (let i = standardMaterials.length - 1; i >= 0; i--) {
    const standardMaterialResource = standardMaterials[i];

    if (getResourceDisposed(ctx, standardMaterialResource.resourceId)) {
      standardMaterials.splice(i, 1);
    }
  }

  for (let i = 0; i < standardMaterials.length; i++) {
    const standardMaterial = standardMaterials[i];
    const materialView = getReadObjectBufferView(standardMaterial.materialTripleBuffer);

    updateSharedTextureResource(ctx, standardMaterial, materialView, "baseColorTexture");
    updateSharedTextureResource(ctx, standardMaterial, materialView, "metallicRoughnessTexture");
    updateSharedTextureResource(ctx, standardMaterial, materialView, "occlusionTexture");
    updateSharedTextureResource(ctx, standardMaterial, materialView, "emissiveTexture");
    updateSharedTextureResource(ctx, standardMaterial, materialView, "normalTexture");
  }
}

function updateSharedTextureResource<Resource extends LocalMaterialResource>(
  ctx: RenderThreadState,
  materialResource: Resource,
  materialView: ReadObjectTripleBufferView<UnlitMaterialTripleBuffer | StandardMaterialTripleBuffer>,
  mapName: keyof Resource
) {
  const anyMaterialResource = materialResource as any;
  const anyCurrentSharedMaterial = materialView as any;

  if (anyCurrentSharedMaterial[mapName][0] !== (anyMaterialResource[mapName]?.resourceId || 0)) {
    const textureResource = getLocalResource<LocalTextureResource>(ctx, anyCurrentSharedMaterial[mapName][0]);

    // Only update if the texture resource is loaded
    if (textureResource) {
      anyMaterialResource[mapName] = textureResource?.resource;
    }
  }
}

/* Local material update functions (Used in mesh.renderer.ts) */

export function updatePrimitiveUnlitMaterial(
  material: PrimitiveUnlitMaterial,
  materialResource: LocalUnlitMaterialResource
) {
  const materialView = getReadObjectBufferView(materialResource.materialTripleBuffer);

  updatePrimitiveBaseMaterial(material, materialView);

  if ("map" in material) {
    material.map = materialResource.baseColorTexture?.texture || null;
  }
}

export function updatePrimitiveStandardMaterial(
  material: PrimitiveStandardMaterial,
  materialResource: LocalStandardMaterialResource
) {
  const materialView = getReadObjectBufferView(materialResource.materialTripleBuffer);

  updatePrimitiveBaseMaterial(material, materialView);

  if ("isMeshStandardMaterial" in material) {
    material.metalness = materialView.metallicFactor[0]; // 🤘
    material.roughness = materialView.roughnessFactor[0];
    material.normalScale.setScalar(materialView.normalTextureScale[0]);
    material.aoMapIntensity = materialView.occlusionTextureStrength[0];
    material.emissive.fromArray(materialView.emissiveFactor);
  }
}

function updatePrimitiveBaseMaterial(
  material: PrimitiveMaterial,
  materialView: ReadObjectTripleBufferView<UnlitMaterialTripleBuffer | StandardMaterialTripleBuffer>
) {
  material.color.fromArray(materialView.baseColorFactor);
  material.opacity = materialView.baseColorFactor[3];
  material.side = materialView.doubleSided[0] ? DoubleSide : FrontSide;
  material.transparent = materialView.alphaMode[0] === MaterialAlphaMode.BLEND;
  material.depthWrite = materialView.alphaMode[0] !== MaterialAlphaMode.BLEND;
  material.alphaTest = materialView.alphaMode[0] === MaterialAlphaMode.MASK ? materialView.alphaCutoff[0] : 0;
}
