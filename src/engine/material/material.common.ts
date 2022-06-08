import { vec3, vec4 } from "gl-matrix";

import { defineObjectBufferSchema, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";

export const UnlitMaterialResourceType = "unlit-material";
export const StandardMaterialResourceType = "standard-material";

export enum MaterialAlphaMode {
  OPAQUE,
  MASK,
  BLEND,
}

export const unlitMaterialSchema = defineObjectBufferSchema({
  doubleSided: [Uint8Array, 1],
  alphaCutoff: [Float32Array, 1],
  alphaMode: [Uint8Array, 1], // MaterialAlphaMode
  baseColorFactor: [Float32Array, 4], // [r, g, b, a]
  baseColorTexture: [Uint32Array, 1], // TODO: Add support for texCoord
  needsUpdate: [Uint8Array, 1], // Update material props (does not necessarily recompile shader like three.js)
});

export const standardMaterialSchema = defineObjectBufferSchema({
  doubleSided: [Uint8Array, 1],
  alphaCutoff: [Float32Array, 1],
  alphaMode: [Uint8Array, 1], // MaterialAlphaMode
  baseColorFactor: [Float32Array, 4], // [r, g, b, a]
  baseColorTexture: [Uint32Array, 1], // TODO: Add support for texCoord
  metallicFactor: [Float32Array, 1],
  roughnessFactor: [Float32Array, 1],
  metallicRoughnessTexture: [Uint32Array, 1], // TODO: Add support for texCoord
  normalTextureScale: [Float32Array, 1],
  normalTexture: [Uint32Array, 1], // TODO: Add support for texCoord
  occlusionTextureStrength: [Float32Array, 1],
  occlusionTexture: [Uint32Array, 1], // TODO: Add support for texCoord
  emissiveFactor: [Float32Array, 3], // [r, g, b],
  emissiveTexture: [Uint32Array, 1], // TODO: Add support for texCoord
  needsUpdate: [Uint8Array, 1], // Update material props (does not necessarily recompile shader like three.js)
});

export type SharedUnlitMaterial = TripleBufferBackedObjectBufferView<typeof unlitMaterialSchema, ArrayBuffer>;
export type SharedStandardMaterial = TripleBufferBackedObjectBufferView<typeof standardMaterialSchema, ArrayBuffer>;

export enum MaterialType {
  Unlit = "unlit",
  Standard = "standard",
}

export interface UnlitMaterialResourceProps {
  doubleSided: boolean; // default false
  alphaCutoff: number; // default 0.5
  alphaMode: MaterialAlphaMode; // default MaterialAlphaMode.OPAQUE
  baseColorFactor: vec4; // default [1, 1, 1, 1]
  baseColorTexture: ResourceId;
}

export interface StandardMaterialResourceProps {
  doubleSided: boolean; // default false
  alphaCutoff: number; // default 0.5
  alphaMode: MaterialAlphaMode; // default MaterialAlphaMode.OPAQUE
  baseColorFactor: vec4; // default [1, 1, 1, 1]
  baseColorTexture: ResourceId;
  metallicFactor: number; // default 1
  roughnessFactor: number; // default 1
  metallicRoughnessTexture: ResourceId;
  normalTextureScale: number; // default 1
  normalTexture: ResourceId;
  occlusionTextureStrength: number; // default 1
  occlusionTexture: ResourceId;
  emissiveFactor: vec3; // default [0, 0, 0]
  emissiveTexture: ResourceId;
}

export type MaterialResourceProps = UnlitMaterialResourceProps | StandardMaterialResourceProps;

export interface SharedUnlitMaterialResource {
  type: MaterialType.Unlit;
  initialProps: UnlitMaterialResourceProps;
  sharedMaterial: SharedUnlitMaterial;
}

export interface SharedStandardMaterialResource {
  type: MaterialType.Standard;
  initialProps: StandardMaterialResourceProps;
  sharedMaterial: SharedStandardMaterial;
}

export type SharedMaterialResource = SharedUnlitMaterialResource | SharedStandardMaterialResource;
