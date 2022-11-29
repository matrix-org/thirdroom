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

import { ImageFormat, RendererImageResource } from "../image/image.render";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { SamplerMagFilter, SamplerMapping, SamplerMinFilter, SamplerWrap, TextureResource } from "../resource/schema";

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

// Should never actually be used but allows us to async initialize the texture in load()
const defaultTexture = new Texture();

export class RendererTextureResource extends defineLocalResourceClass<typeof TextureResource, RenderThreadState>(
  TextureResource
) {
  texture: Texture = defaultTexture;
  declare source: RendererImageResource;

  async load(ctx: RenderThreadState) {
    const rendererModule = getModule(ctx, RendererModule);

    // TODO: Add ImageBitmap to Texture types
    const texture = this.source.texture || new Texture(this.source.image as any);

    const sampler = this.sampler;

    if (sampler) {
      if (this.source.format === ImageFormat.RGBA) {
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

    if (this.source.format === ImageFormat.RGBA) {
      texture.flipY = false;
      // TODO: Can we determine texture encoding when applying to the material?
      texture.encoding = this.encoding;
      texture.needsUpdate = true;
    }

    // Set the texture anisotropy which improves rendering at extreme angles.
    // Note this uses the GPU's maximum anisotropy with an upper limit of 8. We may want to bump this cap up to 16
    // but we should provide a quality setting for GPUs with a high max anisotropy but limited overall resources.
    texture.anisotropy = Math.min(rendererModule.renderer.capabilities.getMaxAnisotropy(), 8);

    this.texture = texture;
  }

  dispose(ctx: RenderThreadState) {
    if (this.source && this.source.format === ImageFormat.RGBA && this.source.texture) {
      this.source.texture.dispose();
    }
  }
}
