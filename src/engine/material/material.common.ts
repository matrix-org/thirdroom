import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";

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
});

export type UnlitMaterialTripleBuffer = ObjectTripleBuffer<typeof unlitMaterialSchema>;
export type StandardMaterialTripleBuffer = ObjectTripleBuffer<typeof standardMaterialSchema>;

export enum MaterialType {
  Unlit = "unlit",
  Standard = "standard",
}

export interface SharedUnlitMaterialResource {
  type: MaterialType.Unlit;
  materialTripleBuffer: UnlitMaterialTripleBuffer;
}

export interface SharedStandardMaterialResource {
  type: MaterialType.Standard;
  materialTripleBuffer: StandardMaterialTripleBuffer;
}

export type SharedMaterialResource = SharedUnlitMaterialResource | SharedStandardMaterialResource;
