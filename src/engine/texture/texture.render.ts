import { LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, Texture, TextureEncoding } from "three";

import { ImageFormat, LocalImageResource } from "../image/image.render";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getResourceDisposed, waitForLocalResource } from "../resource/resource.render";
import { LocalSamplerResource } from "../sampler/sampler.render";
import { SharedTextureResource } from "./texture.common";

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
    initialProps.sampler ? waitForLocalResource<LocalSamplerResource>(ctx, initialProps.sampler) : undefined,
  ]);

  // TODO: Add ImageBitmap to Texture types
  const texture = "texture" in image ? image.texture : new Texture(image.image as any);

  if (sampler) {
    if (image.format === ImageFormat.RGBA) {
      texture.magFilter = sampler.magFilter;
      texture.minFilter = sampler.minFilter;
      texture.wrapS = sampler.wrapS || RepeatWrapping;
      texture.wrapT = sampler.wrapT || RepeatWrapping;
    }

    texture.mapping = sampler.mapping;
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
