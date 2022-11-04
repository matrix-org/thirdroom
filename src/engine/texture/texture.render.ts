import {
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  Texture,
  TextureEncoding,
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
import { ResourceId } from "../resource/resource.common";
import { getResourceDisposed, waitForLocalResource } from "../resource/resource.render";
import { LocalSampler, SamplerMagFilter, SamplerMapping, SamplerMinFilter, SamplerWrap } from "../resource/schema";
import { SharedTextureResource } from "./texture.common";

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

export interface LocalTextureResource {
  resourceId: ResourceId;
  image: LocalImageResource;
  texture: Texture;
}

export async function onLoadLocalTextureResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { initialProps }: SharedTextureResource
): Promise<LocalTextureResource> {
  const rendererModule = getModule(ctx, RendererModule);

  const [image, sampler] = await Promise.all([
    waitForLocalResource<LocalImageResource>(ctx, initialProps.image),
    initialProps.sampler ? waitForLocalResource<LocalSampler>(ctx, initialProps.sampler) : undefined,
  ]);

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
    texture.encoding = initialProps.encoding as unknown as TextureEncoding;
    texture.needsUpdate = true;
  }

  // Set the texture anisotropy which improves rendering at extreme angles.
  // Note this uses the GPU's maximum anisotropy with an upper limit of 8. We may want to bump this cap up to 16
  // but we should provide a quality setting for GPUs with a high max anisotropy but limited overall resources.
  texture.anisotropy = Math.min(rendererModule.renderer.capabilities.getMaxAnisotropy(), 8);

  const localTexture: LocalTextureResource = {
    resourceId,
    image,
    texture,
  };

  rendererModule.textures.push(localTexture);

  return localTexture;
}

export function updateLocalTextureResources(ctx: RenderThreadState, textures: LocalTextureResource[]) {
  for (let i = textures.length - 1; i >= 0; i--) {
    const textureResource = textures[i];

    if (getResourceDisposed(ctx, textureResource.resourceId)) {
      if (textureResource.image.format === ImageFormat.RGBA) {
        textureResource.texture.dispose();
      }

      // Don't dispose the RGBE texture object because we might still be using it

      textures.splice(i, 1);
    }
  }
}
