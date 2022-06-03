import { ImageResourceId } from "../image/image.game";
import { ResourceProps } from "../resource/resource.common";

export const TextureResourceType = "texture";
export const RGBETextureResourceType = "rgbe-texture";

export interface TextureResourceProps extends ResourceProps {
  image: ImageResourceId;
}

export interface RGBETextureResourceProps extends ResourceProps {
  uri: string;
}
