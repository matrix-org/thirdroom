import { vec2 } from "gl-matrix";

import { defineObjectBufferSchema, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";

export const TextureResourceType = "texture";

export const textureSchema = defineObjectBufferSchema({
  offset: [Float32Array, 2],
  rotation: [Float32Array, 1],
  scale: [Float32Array, 2],
  needsUpdate: [Uint8Array, 1],
});

export type SharedTexture = TripleBufferBackedObjectBufferView<typeof textureSchema, ArrayBuffer>;

export enum TextureEncoding {
  Linear = 3000,
  sRGB = 3001,
}

export interface SharedTextureResource {
  initialProps: {
    image: ResourceId;
    sampler?: ResourceId;
    encoding: TextureEncoding;
    offset: vec2;
    rotation: number;
    scale: vec2;
  };
  sharedTexture: SharedTexture;
}
