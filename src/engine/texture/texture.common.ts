import { vec2 } from "gl-matrix";

import { defineObjectBufferSchema, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";

export const RGBATextureResourceType = "rgba-texture";
export const RGBETextureResourceType = "rgbe-texture";

export const textureSchema = defineObjectBufferSchema({
  offset: [Float32Array, 2],
  rotation: [Float32Array, 1],
  scale: [Float32Array, 2],
  needsUpdate: [Uint8Array, 1],
});

export type SharedTexture = TripleBufferBackedObjectBufferView<typeof textureSchema, ArrayBuffer>;

export enum TextureType {
  RGBA = "rgba",
  RGBE = "rgbe",
}

export enum TextureMagFilter {
  NEAREST = 9728,
  LINEAR = 9729,
}

export enum TextureMinFilter {
  NEAREST = 9728,
  LINEAR = 9729,
  NEAREST_MIPMAP_NEAREST = 9984,
  LINEAR_MIPMAP_NEAREST = 9985,
  NEAREST_MIPMAP_LINEAR = 9986,
  LINEAR_MIPMAP_LINEAR = 9987,
}

export enum TextureWrap {
  CLAMP_TO_EDGE = 33071,
  MIRRORED_REPEAT = 33648,
  REPEAT = 10497,
}

export enum TextureEncoding {
  Linear = 3000,
  sRGB = 3001,
}

export interface RGBATextureResourceProps {
  image: ResourceId;
  magFilter?: TextureMagFilter;
  minFilter?: TextureMinFilter;
  wrapS?: TextureWrap;
  wrapT?: TextureWrap;
  encoding?: TextureEncoding;
  offset?: vec2;
  rotation?: number;
  scale?: vec2;
}

export interface RGBETextureResourceProps {
  uri: string;
  magFilter?: TextureMagFilter;
  minFilter?: TextureMinFilter;
  wrapS?: TextureWrap;
  wrapT?: TextureWrap;
  encoding?: TextureEncoding;
  offset?: vec2;
  rotation?: number;
  scale?: vec2;
}

export type TextureResourceProps = RGBATextureResourceProps | RGBETextureResourceProps;

export interface SharedRGBATextureResource {
  type: TextureType.RGBA;
  initialProps: Required<RGBATextureResourceProps>;
  sharedTexture: SharedTexture;
}

export interface SharedRGBETextureResource {
  type: TextureType.RGBE;
  initialProps: Required<RGBETextureResourceProps>;
  sharedTexture: SharedTexture;
}

export type SharedTextureResource = SharedRGBATextureResource | SharedRGBETextureResource;
