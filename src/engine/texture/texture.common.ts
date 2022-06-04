import { ResourceId, ResourceProps } from "../resource/resource.common";

export const TextureResourceType = "texture";
export const RGBETextureResourceType = "rgbe-texture";

export interface TextureResourceProps extends ResourceProps {
  image: ResourceId;
}

export interface RGBETextureResourceProps extends ResourceProps {
  uri: string;
}
