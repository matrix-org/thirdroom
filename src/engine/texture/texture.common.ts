import { ResourceId } from "../resource/resource.common";

export const TextureResourceType = "texture";

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
}
