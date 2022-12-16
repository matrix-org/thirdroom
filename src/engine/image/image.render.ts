import { CompressedTexture, Texture } from "three";

import { BaseThreadContext, getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { ImageResource } from "../resource/schema";
import { toArrayBuffer } from "../utils/arraybuffer";

const HDRMimeType = "image/vnd.radiance";
const HDRExtension = ".hdr";
const KTX2MimeType = "image/ktx2";
const KTX2Extension = ".ktx2";

export enum ImageFormat {
  RGBA = "rgba",
  RGBE = "rgbe",
}

export class RendererImageResource extends defineLocalResourceClass<typeof ImageResource, RenderThreadState>(
  ImageResource
) {
  format?: ImageFormat;
  image?: ImageBitmap;
  texture?: Texture | CompressedTexture;

  async load(ctx: RenderThreadState) {
    const { rgbeLoader, ktx2Loader, imageBitmapLoader, imageBitmapLoaderFlipY } = getModule(ctx, RendererModule);

    let uri: string;
    let isObjectUrl = false;

    if (this.bufferView) {
      const bufferView = this.bufferView;
      const buffer = toArrayBuffer(bufferView.buffer.data, bufferView.byteOffset, bufferView.byteLength);

      const blob = new Blob([buffer], {
        type: this.mimeType,
      });

      uri = URL.createObjectURL(blob);
      isObjectUrl = true;
    } else {
      uri = this.uri;
    }

    const isRGBE = uri.endsWith(HDRExtension) || this.mimeType === HDRMimeType;
    const isKTX2 = uri.endsWith(KTX2Extension) || this.mimeType === KTX2MimeType;

    try {
      if (isRGBE) {
        const texture = await rgbeLoader.loadAsync(uri);
        this.format = ImageFormat.RGBE;
        this.texture = texture;
      } else if (isKTX2) {
        const texture = await ktx2Loader.loadAsync(uri);
        this.format = ImageFormat.RGBA;
        this.texture = texture;
      } else {
        const loader = this.flipY ? imageBitmapLoaderFlipY : imageBitmapLoader;
        const image = await loader.loadAsync(uri);
        this.format = ImageFormat.RGBA;
        this.image = image;
      }
    } finally {
      if (isObjectUrl) {
        URL.revokeObjectURL(uri);
      }
    }
  }

  dispose(ctx: BaseThreadContext) {
    if (this.image) {
      this.image.close();
    } else if (this.texture) {
      this.texture.dispose();
    }
  }
}
