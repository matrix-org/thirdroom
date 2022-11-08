import { CompressedTexture, DataTexture } from "three";

import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { getLocalResources, getResourceDisposed } from "../resource/resource.render";
import { ImageResource, LocalImage } from "../resource/schema";
import { toArrayBuffer } from "../utils/arraybuffer";

const HDRMimeType = "image/vnd.radiance";
const HDRExtension = ".hdr";
const KTX2MimeType = "image/ktx2";
const KTX2Extension = ".ktx2";

export enum ImageFormat {
  RGBA = "rgba",
  RGBE = "rgbe",
}

export interface RGBELocalImageResourceProps {
  format: ImageFormat.RGBE;
  texture: DataTexture;
}

export interface RGBALocalImageResourceProps {
  format: ImageFormat.RGBA;
  image: ImageBitmap;
}

export interface CompressedLocalImageResourceProps {
  format: ImageFormat.RGBA;
  texture: CompressedTexture;
}

export type LocalImageResource = LocalImage &
  (RGBALocalImageResourceProps | RGBELocalImageResourceProps | CompressedLocalImageResourceProps);

export async function onLoadLocalImageResource(
  ctx: RenderThreadState,
  localImage: LocalImage
): Promise<LocalImageResource> {
  const { rgbeLoader, ktx2Loader, imageBitmapLoader, imageBitmapLoaderFlipY } = getModule(ctx, RendererModule);

  let uri: string;
  let isObjectUrl = false;

  if (localImage.bufferView) {
    const bufferView = localImage.bufferView;
    const buffer = toArrayBuffer(bufferView.buffer.data, bufferView.byteOffset, bufferView.byteLength);

    const blob = new Blob([buffer], {
      type: localImage.mimeType,
    });

    uri = URL.createObjectURL(blob);
    isObjectUrl = true;
  } else {
    uri = localImage.uri;
  }

  const isRGBE = uri.endsWith(HDRExtension) || localImage.mimeType === HDRMimeType;
  const isKTX2 = uri.endsWith(KTX2Extension) || localImage.mimeType === KTX2MimeType;

  const localImageResource = localImage as LocalImageResource;

  try {
    if (isRGBE) {
      const texture = await rgbeLoader.loadAsync(uri);
      localImageResource.format = ImageFormat.RGBE;
      (localImageResource as RGBELocalImageResourceProps).texture = texture;
    } else if (isKTX2) {
      const texture = await ktx2Loader.loadAsync(uri);
      localImageResource.format = ImageFormat.RGBA;
      (localImageResource as CompressedLocalImageResourceProps).texture = texture;
    } else {
      const loader = localImage.flipY ? imageBitmapLoaderFlipY : imageBitmapLoader;
      const image = await loader.loadAsync(uri);
      localImageResource.format = ImageFormat.RGBA;
      (localImageResource as RGBALocalImageResourceProps).image = image;
    }
  } finally {
    if (isObjectUrl) {
      URL.revokeObjectURL(uri);
    }
  }

  return localImageResource;
}

export function LocalImageResourceSystem(ctx: RenderThreadState) {
  const images = getLocalResources(ctx, ImageResource) as unknown as LocalImageResource[];

  for (let i = images.length - 1; i >= 0; i--) {
    const imageResource = images[i];

    if (getResourceDisposed(ctx, imageResource.resourceId)) {
      if ("image" in imageResource) {
        imageResource.image.close();
      } else {
        imageResource.texture.dispose();
      }

      images.splice(i, 1);
    }
  }
}
