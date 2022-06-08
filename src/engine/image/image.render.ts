import { DataTexture, ImageBitmapLoader } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import { LocalBufferView } from "../bufferView/bufferView.common";
import { defineModule, getModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { registerResourceLoader, waitForLocalResource } from "../resource/resource.render";
import { ImageResourceProps, ImageResourceType } from "./image.common";

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

interface ImageModuleState {
  imageBitmapLoader: ImageBitmapLoader;
  rgbeLoader: RGBELoader;
}

export const ImageModule = defineModule<RenderThreadState, ImageModuleState>({
  name: "image",
  create() {
    return {
      imageBitmapLoader: new ImageBitmapLoader(),
      rgbeLoader: new RGBELoader(),
    };
  },
  init(ctx) {
    const disposables = [registerResourceLoader(ctx, ImageResourceType, onLoadImage)];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadImage(
  ctx: RenderThreadState,
  id: ResourceId,
  props: ImageResourceProps
): Promise<LocalImageResource> {
  const { rgbeLoader, imageBitmapLoader } = getModule(ctx, ImageModule);

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
