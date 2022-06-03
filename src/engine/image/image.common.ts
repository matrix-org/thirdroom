import { ResourceProps } from "../resource/resource.common";

export const ImageResourceType = "image";

export interface ImageResourceProps extends ResourceProps {
  uri: string;
}
