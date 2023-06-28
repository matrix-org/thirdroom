import { KTX2Container, VK_FORMAT_UNDEFINED } from "ktx-parse";
import { FloatType, HalfFloatType } from "three";
import { RGBE, RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import { getModule } from "../../module/module.common";
import { LoadStatus } from "../../resource/resource.common";
import { getLocalResources } from "../RenderResources";
import { RenderImage } from "../RenderResources";
import { toArrayBuffer } from "../../utils/arraybuffer";
import { ImageFileExtensions, ImageMimeTypes, RenderImageData, RenderImageDataType } from "../textures";
import { ArrayBufferKTX2Loader, KTX2TranscodeResult } from "../ArrayBufferKTX2Loader";
import { RenderContext, RendererModule, RendererModuleState } from "../renderer.render";

export function LoadImageResourcesSystem(ctx: RenderContext) {
  const rendererModule = getModule(ctx, RendererModule);

  const renderImages = getLocalResources(ctx, RenderImage);

  for (let i = 0; i < renderImages.length; i++) {
    const renderImage = renderImages[i];

    if (renderImage.loadStatus === LoadStatus.Uninitialized) {
      const abortController = new AbortController();

      renderImage.abortController = abortController;

      renderImage.loadStatus = LoadStatus.Loading;

      // Prevent creating a new anonymous function every frame by only having
      // _renderImage in scope on the frame when the loadStatus is uninitialized
      const _renderImage = renderImage;

      loadRenderImageData(rendererModule, _renderImage, abortController.signal)
        .then((imageData) => {
          if (_renderImage.loadStatus === LoadStatus.Loaded) {
            throw new Error("Attempted to load a resource that has already been loaded.");
          }

          if (_renderImage.loadStatus !== LoadStatus.Disposed) {
            _renderImage.imageData = imageData;
            _renderImage.loadStatus = LoadStatus.Loaded;
          }
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            return;
          }

          _renderImage.loadStatus = LoadStatus.Error;

          console.error("Error loading image", error);
        });
    }
  }
}

async function loadRenderImageData(
  { rgbeLoader, ktx2Loader }: RendererModuleState,
  renderImage: RenderImage,
  signal: AbortSignal
): Promise<RenderImageData> {
  if (renderImage.bufferView) {
    const bufferView = renderImage.bufferView;
    const buffer = toArrayBuffer(bufferView.buffer.data, bufferView.byteOffset, bufferView.byteLength);

    if (renderImage.mimeType === ImageMimeTypes.HDR) {
      const data = loadRGBEFromArrayBuffer(rgbeLoader, buffer);
      return { type: RenderImageDataType.RGBE, data };
    } else if (renderImage.mimeType === ImageMimeTypes.KTX2) {
      // TODO: RenderImage should only store image data and not textures
      const data = await loadKTX2DataFromArrayBuffer(ktx2Loader, buffer);
      return { type: RenderImageDataType.KTX2, data };
    } else {
      const blob = new Blob([buffer], { type: renderImage.mimeType });
      const data = await loadImageBitmapFromBlob(blob, renderImage.flipY);
      return { type: RenderImageDataType.ImageBitmap, data };
    }
  } else {
    const uri = renderImage.uri;
    const response = await fetch(uri, { signal });

    if (uri.endsWith(ImageFileExtensions.HDR)) {
      const buffer = await response.arrayBuffer();
      const data = loadRGBEFromArrayBuffer(rgbeLoader, buffer);
      return { type: RenderImageDataType.RGBE, data };
    } else if (uri.endsWith(ImageFileExtensions.KTX2)) {
      const buffer = await response.arrayBuffer();
      // TODO: RenderImage should only store image data and not textures
      const data = await loadKTX2DataFromArrayBuffer(ktx2Loader, buffer);
      return { type: RenderImageDataType.KTX2, data };
    } else {
      const blob = await response.blob();
      const data = await loadImageBitmapFromBlob(blob, renderImage.flipY);
      return { type: RenderImageDataType.ImageBitmap, data };
    }
  }
}

function loadImageBitmapFromBlob(blob: Blob, flipY: boolean): Promise<ImageBitmap> {
  return createImageBitmap(blob, {
    premultiplyAlpha: "none",
    imageOrientation: flipY ? "flipY" : undefined,
    colorSpaceConversion: "none",
  });
}

function loadRGBEFromArrayBuffer(rgbeLoader: RGBELoader, buffer: ArrayBuffer): RGBE {
  const texData = rgbeLoader.parse(buffer) as RGBE | null;

  if (!texData) {
    throw new Error("Error parsing RGBE texture.");
  }

  if (!(texData.type === FloatType || texData.type === HalfFloatType)) {
    throw new Error("Unsupported RGBE texture type");
  }

  return texData;
}

async function loadKTX2DataFromArrayBuffer(
  ktx2Loader: ArrayBufferKTX2Loader,
  buffer: ArrayBuffer
): Promise<KTX2TranscodeResult | KTX2Container> {
  const loader = ktx2Loader as ArrayBufferKTX2Loader;

  const container = await loader._readKTX2Container(buffer);

  if (container.vkFormat !== VK_FORMAT_UNDEFINED) {
    return container;
  }

  const event = await loader._transcodeTexture(buffer);

  const result = event.data;

  if (result.type === "error") {
    throw new Error(result.error);
  }

  return result;
}
