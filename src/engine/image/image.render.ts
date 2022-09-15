import { CompressedTexture, DataTexture } from "three";

import { LocalBufferView } from "../bufferView/bufferView.common";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getResourceDisposed, waitForLocalResource } from "../resource/resource.render";
import { ImageResourceProps } from "./image.common";

const HDRMimeType = "image/vnd.radiance";
const HDRExtension = ".hdr";
const KTX2MimeType = "image/ktx2";
const KTX2Extension = ".ktx2";

export enum ImageFormat {
  RGBA = "rgba",
  RGBE = "rgbe",
}

export interface RGBELocalImageResource {
  resourceId: ResourceId;
  format: ImageFormat.RGBE;
  texture: DataTexture;
}

export interface RGBALocalImageResource {
  resourceId: ResourceId;
  format: ImageFormat.RGBA;
  image: ImageBitmap;
}

export interface CompressedLocalImageResource {
  resourceId: ResourceId;
  format: ImageFormat.RGBA;
  texture: CompressedTexture;
}

export type LocalImageResource = RGBALocalImageResource | RGBELocalImageResource | CompressedLocalImageResource;

export async function onLoadLocalImageResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  props: ImageResourceProps
): Promise<LocalImageResource> {
  const { rgbeLoader, ktx2Loader, imageBitmapLoader, imageBitmapLoaderFlipY, images } = getModule(ctx, RendererModule);

  let uri: string;
  let isObjectUrl = false;

  if ("bufferView" in props) {
    const { buffer } = await waitForLocalResource<LocalBufferView>(ctx, props.bufferView);

    const blob = new Blob([buffer], {
      type: props.mimeType,
    });

    uri = URL.createObjectURL(blob);
    isObjectUrl = true;
  } else {
    uri = props.uri;
  }

  const isRGBE = uri.endsWith(HDRExtension) || ("mimeType" in props && props.mimeType === HDRMimeType);
  const isKTX2 = uri.endsWith(KTX2Extension) || ("mimeType" in props && props.mimeType === KTX2MimeType);

  let localImageResource: LocalImageResource;

  try {
    if (isRGBE) {
      const texture = await rgbeLoader.loadAsync(uri);

      localImageResource = {
        resourceId,
        format: ImageFormat.RGBE,
        texture,
      };
    } else if (isKTX2) {
      const texture = await ktx2Loader.loadAsync(uri);

      localImageResource = {
        resourceId,
        format: ImageFormat.RGBA,
        texture,
      };
    } else {
      const loader = props.flipY ? imageBitmapLoaderFlipY : imageBitmapLoader;
      const image = await loader.loadAsync(uri);

      localImageResource = {
        resourceId,
        format: ImageFormat.RGBA,
        image,
      };
    }
  } finally {
    if (isObjectUrl) {
      URL.revokeObjectURL(uri);
    }
  }

  images.push(localImageResource);

  return localImageResource;
}

export function updateLocalImageResources(ctx: RenderThreadState, images: LocalImageResource[]) {
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
