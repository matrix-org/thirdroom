import { LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, Texture, TextureEncoding } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { ImageFormat, LocalImageResource } from "../image/image.render";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getResourceDisposed, waitForLocalResource } from "../resource/resource.render";
import { LocalSamplerResource } from "../sampler/sampler.render";
import { TextureTripleBuffer, SharedTextureResource } from "./texture.common";

export interface LocalTextureResource {
  resourceId: ResourceId;
  image: LocalImageResource;
  texture: Texture;
  textureTripleBuffer: TextureTripleBuffer;
}

export async function onLoadLocalTextureResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { initialProps, textureTripleBuffer }: SharedTextureResource
): Promise<LocalTextureResource> {
  const rendererModule = getModule(ctx, RendererModule);

  const [image, sampler] = await Promise.all([
    waitForLocalResource<LocalImageResource>(ctx, initialProps.image),
    initialProps.sampler ? waitForLocalResource<LocalSamplerResource>(ctx, initialProps.sampler) : undefined,
  ]);

  // TODO: Add ImageBitmap to Texture types
  const texture = image.format === ImageFormat.RGBA ? new Texture(image.image as any) : image.texture;

  if (sampler) {
    if (image.format !== ImageFormat.RGBE) {
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

  const localTexture: LocalTextureResource = {
    resourceId,
    image,
    texture,
    textureTripleBuffer,
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

  for (let i = 0; i < textures.length; i++) {
    const { texture, textureTripleBuffer } = textures[i];
    const textureBufferView = getReadObjectBufferView(textureTripleBuffer);

    texture.offset.fromArray(textureBufferView.offset);
    texture.rotation = textureBufferView.rotation[0];
    texture.repeat.fromArray(textureBufferView.scale);
  }
}
