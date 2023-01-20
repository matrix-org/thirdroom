import {
  ClampToEdgeWrapping,
  CompressedTexture,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CubeUVReflectionMapping,
  DataTexture,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  FloatType,
  HalfFloatType,
  LinearEncoding,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  Mapping,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  RepeatWrapping,
  Texture,
  TextureFilter,
  UVMapping,
  Wrapping,
  TextureEncoding as ThreeTextureEncoding,
  CompressedPixelFormat,
  Data3DTexture,
  WebGLRenderer,
} from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { RGBE, RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { KTX2Container, VK_FORMAT_UNDEFINED } from "ktx-parse";

import { getModule } from "../module/module.common";
import { RendererModule, RendererModuleState, RenderThreadState } from "../renderer/renderer.render";
import { LoadStatus } from "../resource/resource.common";
import { getLocalResources, RenderImage, RenderTexture } from "../resource/resource.render";
import { SamplerMagFilter, SamplerMapping, SamplerMinFilter, SamplerWrap, TextureFormat } from "../resource/schema";
import { toArrayBuffer } from "./arraybuffer";

/**
 * These loader functions allow us to avoid converting from
 * ArrayBuffer -> Blob -> fetch() -> Response -> ArrayBuffer
 * when loading from a glTF where the image data is in a BufferView.
 **/

export interface KTX2TranscodeResult {
  type: "transcode";
  mipmaps: ImageData[];
  width: number;
  height: number;
  hasAlpha: boolean;
  format: CompressedPixelFormat;
  dfdTransferFn: number;
  dfdFlags: number;
}

interface KTX2TranscodeError {
  type: "error";
  error: string;
}

export type ArrayBufferKTX2Loader = KTX2Loader & {
  init(): Promise<void>;
  _readKTX2Container(buffer: ArrayBuffer): Promise<KTX2Container>;
  _transcodeTexture(
    buffer: ArrayBuffer,
    config?: unknown
  ): Promise<MessageEvent<KTX2TranscodeResult | KTX2TranscodeError>>;
  _loadTextureFromTranscodeResult(transcodeResult: KTX2TranscodeResult, texture: CompressedTexture): void;
  _loadTextureFromKTX2Container<T extends DataTexture | Data3DTexture>(
    container: KTX2Container,
    texture: T
  ): Promise<T>;
};

export async function initKTX2Loader(transcoderPath: string, renderer: WebGLRenderer): Promise<ArrayBufferKTX2Loader> {
  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath(transcoderPath)
    .detectSupport(renderer) as ArrayBufferKTX2Loader;
  await ktx2Loader.init();
  return ktx2Loader;
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

interface DataTextureImage {
  data: Float32Array | Uint16Array | Uint8Array;
  width: number;
  height: number;
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

function loadTextureFromRGBE(texData: RGBE, texture: DataTexture): DataTexture {
  // TODO: Three.js types are wrong here
  const image = texture.image as unknown as DataTextureImage;

  image.width = texData.width;
  image.height = texData.height;
  image.data = texData.data;
  texture.type = texData.type;
  texture.needsUpdate = true;
  texture.encoding = LinearEncoding;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.flipY = true;

  return texture;
}

function loadImageBitmapFromBlob(blob: Blob, flipY: boolean): Promise<ImageBitmap> {
  return createImageBitmap(blob, {
    premultiplyAlpha: "none",
    imageOrientation: flipY ? "flipY" : undefined,
    colorSpaceConversion: "none",
  });
}

const HDRMimeType = "image/vnd.radiance";
const HDRExtension = ".hdr";
const KTX2MimeType = "image/ktx2";
const KTX2Extension = ".ktx2";

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
      data: KTX2Container | KTX2TranscodeResult;
    };

async function loadRenderImageData(
  { rgbeLoader, ktx2Loader }: RendererModuleState,
  renderImage: RenderImage,
  signal: AbortSignal
): Promise<RenderImageData> {
  if (renderImage.bufferView) {
    const bufferView = renderImage.bufferView;
    const buffer = toArrayBuffer(bufferView.buffer.data, bufferView.byteOffset, bufferView.byteLength);

    if (renderImage.mimeType === HDRMimeType) {
      const data = loadRGBEFromArrayBuffer(rgbeLoader, buffer);
      return { type: RenderImageDataType.RGBE, data };
    } else if (renderImage.mimeType === KTX2MimeType) {
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

    if (uri.endsWith(HDRExtension)) {
      const buffer = await response.arrayBuffer();
      const data = loadRGBEFromArrayBuffer(rgbeLoader, buffer);
      return { type: RenderImageDataType.RGBE, data };
    } else if (uri.endsWith(KTX2Extension)) {
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

export function updateImageResources(ctx: RenderThreadState) {
  const rendererModule = getModule(ctx, RendererModule);

  const renderImages = getLocalResources(ctx, RenderImage);

  for (let i = 0; i < renderImages.length; i++) {
    const renderImage = renderImages[i];

    if (renderImage.loadStatus === LoadStatus.Uninitialized) {
      const abortController = new AbortController();

      renderImage.abortController = abortController;

      renderImage.loadStatus = LoadStatus.Loading;

      loadRenderImageData(rendererModule, renderImage, abortController.signal)
        .then((imageData) => {
          if (renderImage.loadStatus === LoadStatus.Loaded) {
            throw new Error("Attempted to load a resource that has already been loaded.");
          }

          if (renderImage.loadStatus !== LoadStatus.Disposed) {
            renderImage.imageData = imageData;
            renderImage.loadStatus = LoadStatus.Loaded;
          }
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            return;
          }

          renderImage.loadStatus = LoadStatus.Error;
        });
    }
  }
}

const ThreeMinFilters: { [key: number]: TextureFilter } = {
  [SamplerMinFilter.NEAREST]: NearestFilter,
  [SamplerMinFilter.LINEAR]: LinearFilter,
  [SamplerMinFilter.NEAREST_MIPMAP_NEAREST]: NearestMipmapNearestFilter,
  [SamplerMinFilter.LINEAR_MIPMAP_NEAREST]: LinearMipmapNearestFilter,
  [SamplerMinFilter.NEAREST_MIPMAP_LINEAR]: NearestMipmapLinearFilter,
  [SamplerMinFilter.LINEAR_MIPMAP_LINEAR]: LinearMipmapLinearFilter,
};

const ThreeMagFilters: { [key: number]: TextureFilter } = {
  [SamplerMagFilter.NEAREST]: NearestFilter,
  [SamplerMagFilter.LINEAR]: LinearFilter,
};

const ThreeWrappings: { [key: number]: Wrapping } = {
  [SamplerWrap.CLAMP_TO_EDGE]: ClampToEdgeWrapping,
  [SamplerWrap.MIRRORED_REPEAT]: MirroredRepeatWrapping,
  [SamplerWrap.REPEAT]: RepeatWrapping,
};

const ThreeMapping: { [key: number]: Mapping } = {
  [SamplerMapping.UVMapping]: UVMapping,
  [SamplerMapping.CubeReflectionMapping]: CubeReflectionMapping,
  [SamplerMapping.CubeRefractionMapping]: CubeRefractionMapping,
  [SamplerMapping.EquirectangularReflectionMapping]: EquirectangularReflectionMapping,
  [SamplerMapping.EquirectangularRefractionMapping]: EquirectangularRefractionMapping,
  [SamplerMapping.CubeUVReflectionMapping]: CubeUVReflectionMapping,
};

function initRenderTexture(renderTexture: RenderTexture): Texture | CompressedTexture | DataTexture | Data3DTexture {
  const source = renderTexture.source;

  let texture: Texture | CompressedTexture | DataTexture | Data3DTexture;

  let isRGBE = false;

  if (source.mimeType === HDRMimeType || source.uri?.endsWith(HDRExtension)) {
    isRGBE = true;
    texture = new DataTexture();
  } else if (source.mimeType === KTX2MimeType || source.uri?.endsWith(KTX2Extension)) {
    if (renderTexture.format === TextureFormat.Unknown) {
      if (renderTexture.depth > 1) {
        texture = new (Data3DTexture as any)();
      } else {
        texture = new DataTexture();
      }
    } else {
      // TODO: CompressedArrayTexture
      texture = new (CompressedTexture as any)();
    }
  } else {
    texture = new Texture();
    texture.flipY = false;
  }

  updateTextureProperties(renderTexture, texture, isRGBE);

  return texture;
}

async function loadRenderTexture<T extends Texture | CompressedTexture | DataTexture | Data3DTexture>(
  ktx2Loader: ArrayBufferKTX2Loader,
  renderTexture: RenderTexture,
  imageData: RenderImageData,
  texture: T
): Promise<T> {
  let isRGBE = false;

  if (imageData.type === RenderImageDataType.KTX2) {
    const ktx2 = imageData.data;

    if ("type" in ktx2) {
      ktx2Loader._loadTextureFromTranscodeResult(ktx2, texture as CompressedTexture);
    } else {
      await ktx2Loader._loadTextureFromKTX2Container(ktx2, texture as DataTexture | Data3DTexture);
    }
  } else if (imageData.type === RenderImageDataType.ImageBitmap) {
    texture.image = imageData.data;
  } else if (imageData.type === RenderImageDataType.RGBE) {
    // TODO: RGBE texture encoding should be set in the glTF loader using an extension
    loadTextureFromRGBE(imageData.data, texture as DataTexture);
    isRGBE = true;
  } else {
    throw new Error("Unknown image data type");
  }

  updateTextureProperties(renderTexture, texture, isRGBE);

  texture.needsUpdate = true;

  return texture;
}

function updateTextureProperties(renderTexture: RenderTexture, texture: Texture, isRGBE: boolean) {
  const sampler = renderTexture.sampler;

  if (sampler) {
    // TODO: RGBE background texture needs to use correct texture sampler parameters
    if (!isRGBE) {
      texture.magFilter = ThreeMagFilters[sampler.magFilter];
      texture.minFilter = ThreeMinFilters[sampler.minFilter];
      texture.wrapS = ThreeWrappings[sampler.wrapS];
      texture.wrapT = ThreeWrappings[sampler.wrapT];
    }

    texture.mapping = ThreeMapping[sampler.mapping];
  } else {
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
  }

  if (!isRGBE) {
    texture.encoding = renderTexture.encoding as unknown as ThreeTextureEncoding;
  }
}

export function updateTextureResources(ctx: RenderThreadState) {
  const { ktx2Loader } = getModule(ctx, RendererModule);

  const renderTextures = getLocalResources(ctx, RenderTexture);

  for (let i = 0; i < renderTextures.length; i++) {
    const renderTexture = renderTextures[i];

    if (renderTexture.texture === undefined) {
      renderTexture.texture = initRenderTexture(renderTexture);
    }

    if (renderTexture.loadStatus === LoadStatus.Uninitialized && renderTexture.source.imageData) {
      const abortController = new AbortController();

      renderTexture.abortController = abortController;

      renderTexture.loadStatus = LoadStatus.Loading;

      loadRenderTexture(ktx2Loader, renderTexture, renderTexture.source.imageData, renderTexture.texture)
        .then(() => {
          if (renderTexture.loadStatus === LoadStatus.Loaded) {
            throw new Error("Attempted to load a resource that has already been loaded.");
          }

          if (renderTexture.loadStatus !== LoadStatus.Disposed) {
            renderTexture.loadStatus = LoadStatus.Loaded;
          }
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            return;
          }

          renderTexture.loadStatus = LoadStatus.Error;
        });
    }
  }
}
