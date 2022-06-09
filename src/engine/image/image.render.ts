import { DataTexture } from "three";

import { LocalBufferView } from "../bufferView/bufferView.common";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { waitForLocalResource } from "../resource/resource.render";
import { ImageResourceProps } from "./image.common";

const HDRMimeType = "image/vnd.radiance";
const HDRExtension = ".hdr";

export enum ImageFormat {
  RGBA = "rgba",
  RGBE = "rgbe",
}

export interface RGBELocalImageResource {
  format: ImageFormat.RGBE;
  texture: DataTexture;
}

export interface RGBALocalImageResource {
  format: ImageFormat.RGBA;
  image: ImageBitmap;
}

export type LocalImageResource = RGBALocalImageResource | RGBELocalImageResource;

export async function onLoadLocalImageResource(
  ctx: RenderThreadState,
  id: ResourceId,
  props: ImageResourceProps
): Promise<LocalImageResource> {
  const { rgbeLoader, imageBitmapLoader } = getModule(ctx, RendererModule);

  let uri: string;

  if ("bufferView" in props) {
    const { buffer } = await waitForLocalResource<LocalBufferView>(ctx, props.bufferView);

    const blob = new Blob([buffer], {
      type: props.mimeType,
    });

    uri = URL.createObjectURL(blob);
  } else {
    uri = props.uri;
  }

  const isRGBE = uri.endsWith(HDRExtension) || ("mimeType" in props && props.mimeType === HDRMimeType);

  if (isRGBE) {
    return {
      format: ImageFormat.RGBE,
      texture: await rgbeLoader.loadAsync(uri),
    };
  } else {
    return {
      format: ImageFormat.RGBA,
      image: await imageBitmapLoader.loadAsync(uri),
    };
  }
}
