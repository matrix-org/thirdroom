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
} from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { RGBE, RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import { getModule } from "../module/module.common";
import { RendererModule, RendererModuleState, RenderThreadState } from "../renderer/renderer.render";
import { LoadStatus } from "../resource/resource.common";
import { getLocalResources, RenderImage, RenderTexture } from "../resource/resource.render";
import { SamplerMagFilter, SamplerMapping, SamplerMinFilter, SamplerWrap } from "../resource/schema";
import { toArrayBuffer } from "./arraybuffer";

/**
 * These loader functions allow us to avoid converting from
 * ArrayBuffer -> Blob -> fetch() -> Response -> ArrayBuffer
 * when loading from a glTF where the image data is in a BufferView.
 */

type ArrayBufferKTX2Loader = KTX2Loader & { _createTexture: (buffer: ArrayBuffer) => Promise<CompressedTexture> };

function loadKTX2TextureFromArrayBuffer(ktx2Loader: KTX2Loader, buffer: ArrayBuffer): Promise<CompressedTexture> {
  // TODO: Expose _createTexture publicly in KTX2Loader
  return (ktx2Loader as ArrayBufferKTX2Loader)._createTexture(buffer);
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

function createDataTextureFromRGBE(texData: RGBE) {
  const texture = new DataTexture();

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

async function loadRenderImageData(
  { rgbeLoader, ktx2Loader }: RendererModuleState,
  renderImage: RenderImage,
  signal: AbortSignal
): Promise<ImageBitmap | RGBE | CompressedTexture> {
  if (renderImage.bufferView) {
    const bufferView = renderImage.bufferView;
    const buffer = toArrayBuffer(bufferView.buffer.data, bufferView.byteOffset, bufferView.byteLength);

    if (renderImage.mimeType === HDRMimeType) {
      return loadRGBEFromArrayBuffer(rgbeLoader, buffer);
    } else if (renderImage.mimeType === KTX2MimeType) {
      // TODO: RenderImage should only store image data and not textures
      return await loadKTX2TextureFromArrayBuffer(ktx2Loader, buffer);
    } else {
      const blob = new Blob([buffer], { type: renderImage.mimeType });
      return await loadImageBitmapFromBlob(blob, renderImage.flipY);
    }
  } else {
    const uri = renderImage.uri;
    const response = await fetch(uri, { signal });

    if (uri.endsWith(HDRExtension)) {
      const buffer = await response.arrayBuffer();
      return loadRGBEFromArrayBuffer(rgbeLoader, buffer);
    } else if (uri.endsWith(KTX2Extension)) {
      const buffer = await response.arrayBuffer();
      // TODO: RenderImage should only store image data and not textures
      return await loadKTX2TextureFromArrayBuffer(ktx2Loader, buffer);
    } else {
      const blob = await response.blob();
      return loadImageBitmapFromBlob(blob, renderImage.flipY);
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
            renderImage.image = imageData;
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

function loadTexture(rendererModule: RendererModuleState, renderTexture: RenderTexture): Texture {
  let texture;

  let isRGBE = false;

  if (renderTexture.source.image && "isCompressedTexture" in renderTexture.source.image) {
    texture = renderTexture.source.image;
    // TODO: Can we determine texture encoding when applying to the material?
    texture.encoding = renderTexture.encoding as unknown as ThreeTextureEncoding;
    texture.needsUpdate = true;
  } else if (renderTexture.source.image instanceof ImageBitmap) {
    // TODO: Add ImageBitmap to Texture types
    texture = new Texture(renderTexture.source.image as any);
    texture.flipY = false;
    // TODO: Can we determine texture encoding when applying to the material?
    texture.encoding = renderTexture.encoding as unknown as ThreeTextureEncoding;
    texture.needsUpdate = true;
  } else {
    // TODO: RGBE texture encoding should be set in the glTF loader using an extension
    texture = createDataTextureFromRGBE(renderTexture.source.image as RGBE);
    isRGBE = true;
  }

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

  // Set the texture anisotropy which improves rendering at extreme angles.
  // Note this uses the GPU's maximum anisotropy with an upper limit of 8. We may want to bump this cap up to 16
  // but we should provide a quality setting for GPUs with a high max anisotropy but limited overall resources.
  texture.anisotropy = Math.min(rendererModule.renderer.capabilities.getMaxAnisotropy(), 8);

  return texture;
}

export function updateTextureResources(ctx: RenderThreadState) {
  const rendererModule = getModule(ctx, RendererModule);

  const renderTextures = getLocalResources(ctx, RenderTexture);

  for (let i = 0; i < renderTextures.length; i++) {
    const renderTexture = renderTextures[i];

    if (renderTexture.texture === undefined) {
      renderTexture.texture = loadTexture(rendererModule, renderTexture);
    }
  }
}
