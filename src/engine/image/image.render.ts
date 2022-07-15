import { DataTexture } from "three";

import { LocalBufferView } from "../bufferView/bufferView.common";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getResourceDisposed, waitForLocalResource } from "../resource/resource.render";
import { ImageResourceProps } from "./image.common";

const HDRMimeType = "image/vnd.radiance";
const HDRExtension = ".hdr";

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

export type LocalImageResource = RGBALocalImageResource | RGBELocalImageResource;

export async function onLoadLocalImageResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  props: ImageResourceProps
): Promise<LocalImageResource> {
  const { rgbeLoader, imageBitmapLoader, images } = getModule(ctx, RendererModule);

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

  let localImageResource: LocalImageResource;

  if (isRGBE) {
    const texture = await rgbeLoader.loadAsync(uri);

    if (isObjectUrl) {
      URL.revokeObjectURL(uri);
    }

    localImageResource = {
      resourceId,
      format: ImageFormat.RGBE,
      texture,
    };
  } else {
    const image = await imageBitmapLoader.loadAsync(uri);

    if (isObjectUrl) {
      URL.revokeObjectURL(uri);
    }

    localImageResource = {
      resourceId,
      format: ImageFormat.RGBA,
      image,
    };
  }

  images.push(localImageResource);

  return localImageResource;
}

export function updateLocalImageResources(ctx: RenderThreadState, images: LocalImageResource[]) {
  for (let i = images.length - 1; i >= 0; i--) {
    const imageResource = images[i];

    if (getResourceDisposed(ctx, imageResource.resourceId)) {
      if (imageResource.format === ImageFormat.RGBA) {
        imageResource.image.close();
      } else {
        imageResource.texture.dispose();
      }

      images.splice(i, 1);
    }
  }
}
