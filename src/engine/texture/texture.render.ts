import {
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  Texture,
  ClampToEdgeWrapping,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CubeUVReflectionMapping,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  LinearMipmapNearestFilter,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  UVMapping,
  Mapping,
  TextureFilter,
  Wrapping,
} from "three";

import { ImageFormat, LocalImageResource } from "../image/image.render";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { getLocalResources, getResourceDisposed } from "../resource/resource.render";
import {
  LocalTexture,
  SamplerMagFilter,
  SamplerMapping,
  SamplerMinFilter,
  SamplerWrap,
  TextureResource,
} from "../resource/schema";

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

export type LocalTextureResource = LocalTexture & {
  texture: Texture;
};

export async function onLoadLocalTextureResource(
  ctx: RenderThreadState,
  localTexture: LocalTexture
): Promise<LocalTextureResource> {
  const rendererModule = getModule(ctx, RendererModule);

  const image = localTexture.source as LocalImageResource;
  const sampler = localTexture.sampler;
  // TODO: Add ImageBitmap to Texture types
  const texture = "texture" in image ? image.texture : new Texture(image.image as any);

  if (sampler) {
    if (image.format === ImageFormat.RGBA) {
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

  if (image.format === ImageFormat.RGBA) {
    texture.flipY = false;
    // TODO: Can we determine texture encoding when applying to the material?
    texture.encoding = localTexture.encoding;
    texture.needsUpdate = true;
  }

  // Set the texture anisotropy which improves rendering at extreme angles.
  // Note this uses the GPU's maximum anisotropy with an upper limit of 8. We may want to bump this cap up to 16
  // but we should provide a quality setting for GPUs with a high max anisotropy but limited overall resources.
  texture.anisotropy = Math.min(rendererModule.renderer.capabilities.getMaxAnisotropy(), 8);

  const localTextureResource = localTexture as LocalTextureResource;
  localTextureResource.texture = texture;

  return localTextureResource;
}

export function LocalTextureResourceSystem(ctx: RenderThreadState) {
  const textures = getLocalResources(ctx, TextureResource) as unknown as LocalTextureResource[];

  for (let i = textures.length - 1; i >= 0; i--) {
    const textureResource = textures[i];

    if (getResourceDisposed(ctx, textureResource.resourceId)) {
      if ((textureResource.source as LocalImageResource).format === ImageFormat.RGBA) {
        textureResource.texture.dispose();
      }

      // Don't dispose the RGBE texture object because we might still be using it

      textures.splice(i, 1);
    }
  }
}
