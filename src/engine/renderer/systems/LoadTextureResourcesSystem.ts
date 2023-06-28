import {
  Texture,
  CompressedTexture,
  DataTexture,
  Data3DTexture,
  TextureEncoding as ThreeTextureEncoding,
  ClampToEdgeWrapping,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CubeUVReflectionMapping,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  Mapping,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  RepeatWrapping,
  TextureFilter,
  UVMapping,
  Wrapping,
  LinearEncoding,
} from "three";
import { RGBE } from "three/examples/jsm/loaders/RGBELoader";

import { getModule } from "../../module/module.common";
import { LoadStatus } from "../../resource/resource.common";
import { getLocalResources, RenderTexture } from "../RenderResources";
import { SamplerMagFilter, SamplerMapping, SamplerMinFilter, SamplerWrap, TextureFormat } from "../../resource/schema";
import { ImageFileExtensions, ImageMimeTypes, RenderImageData, RenderImageDataType } from "../textures";
import { ArrayBufferKTX2Loader } from "../ArrayBufferKTX2Loader";
import { RenderContext, RendererModule } from "../renderer.render";

export function LoadTextureResourcesSystem(ctx: RenderContext) {
  const { ktx2Loader } = getModule(ctx, RendererModule);

  const renderTextures = getLocalResources(ctx, RenderTexture);

  for (let i = 0; i < renderTextures.length; i++) {
    const renderTexture = renderTextures[i];

    if (renderTexture.texture === undefined) {
      renderTexture.texture = initRenderTexture(renderTexture);
    }

    if (renderTexture.loadStatus === LoadStatus.Uninitialized && renderTexture.source.imageData) {
      const abortController = new AbortController();

      const _renderTexture = renderTexture;

      _renderTexture.abortController = abortController;

      _renderTexture.loadStatus = LoadStatus.Loading;

      loadRenderTexture(ktx2Loader, _renderTexture, _renderTexture.source.imageData!, _renderTexture.texture!)
        .then(() => {
          if (_renderTexture.loadStatus === LoadStatus.Loaded) {
            throw new Error("Attempted to load a resource that has already been loaded.");
          }

          if (_renderTexture.loadStatus !== LoadStatus.Disposed) {
            _renderTexture.loadStatus = LoadStatus.Loaded;
          }
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            return;
          }

          _renderTexture.loadStatus = LoadStatus.Error;

          console.error("Error loading texture", error);
        });
    }
  }
}

function initRenderTexture(renderTexture: RenderTexture): Texture | CompressedTexture | DataTexture | Data3DTexture {
  const source = renderTexture.source;

  let texture: Texture | CompressedTexture | DataTexture | Data3DTexture;

  let isRGBE = false;

  if (source.mimeType === ImageMimeTypes.HDR || source.uri?.endsWith(ImageFileExtensions.HDR)) {
    isRGBE = true;
    texture = new DataTexture();
  } else if (source.mimeType === ImageMimeTypes.KTX2 || source.uri?.endsWith(ImageFileExtensions.KTX2)) {
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

interface DataTextureImage {
  data: Float32Array | Uint16Array | Uint8Array;
  width: number;
  height: number;
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
