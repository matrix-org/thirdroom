import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";

export const TextureResourceType = "texture";

export const textureSchema = defineObjectBufferSchema({
  offset: [Float32Array, 2],
  rotation: [Float32Array, 1],
  scale: [Float32Array, 2],
});

export type TextureTripleBuffer = ObjectTripleBuffer<typeof textureSchema>;

export enum TextureEncoding {
  Linear = 3000,
  sRGB = 3001,
}

export interface SharedTextureResource {
  initialProps: {
    image: ResourceId;
    sampler?: ResourceId;
    encoding: TextureEncoding;
  };
  textureTripleBuffer: TextureTripleBuffer;
}
