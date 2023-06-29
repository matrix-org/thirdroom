import { RGBE } from "three/examples/jsm/loaders/RGBELoader";

import { KTX2RenderImageData } from "./ArrayBufferKTX2Loader";

export const ImageMimeTypes = {
  HDR: "image/vnd.radiance",
  KTX2: "image/ktx2",
};

export const ImageFileExtensions = {
  HDR: ".hdr",
  KTX2: ".ktx2",
};

export enum RenderImageDataType {
  RGBE,
  ImageBitmap,
  KTX2,
}

export type RenderImageData =
  | {
      type: RenderImageDataType.RGBE;
      data: RGBE;
    }
  | {
      type: RenderImageDataType.ImageBitmap;
      data: ImageBitmap;
    }
  | {
      type: RenderImageDataType.KTX2;
      data: KTX2RenderImageData;
    };
