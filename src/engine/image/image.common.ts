export const ImageResourceType = "image";

export type ImageResourceProps =
  | {
      image: undefined;
      uri: string;
    }
  | {
      uri: undefined;
      image: ImageBitmap;
    };
