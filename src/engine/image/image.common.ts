import { ResourceId } from "../resource/resource.common";

export const ImageResourceType = "image";

export type ImageResourceProps =
  | {
      bufferView: ResourceId;
      mimeType: string;
    }
  | { uri: string };
