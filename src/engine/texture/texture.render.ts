import { LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, Texture, TextureEncoding } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { ImageFormat, LocalImageResource } from "../image/image.render";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { waitForLocalResource } from "../resource/resource.render";
import { LocalSamplerResource } from "../sampler/sampler.render";
import { SharedTexture, SharedTextureResource } from "./texture.common";

export interface LocalTextureResource {
  resourceId: ResourceId;
  forceUpdate: boolean;
  texture: Texture;
  sharedTexture: SharedTexture;
}

export async function onLoadLocalTextureResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { initialProps, sharedTexture }: SharedTextureResource
): Promise<LocalTextureResource> {
  const rendererModule = getModule(ctx, RendererModule);

  const [image, sampler] = await Promise.all([
    waitForLocalResource<LocalImageResource>(ctx, initialProps.image),
    initialProps.sampler ? waitForLocalResource<LocalSamplerResource>(ctx, initialProps.sampler) : undefined,
  ]);

  // TODO: Add ImageBitmap to Texture types
  const texture = image.format === ImageFormat.RGBA ? new Texture(image as any) : image.texture;

  if (sampler) {
    texture.magFilter = sampler.magFilter;
    texture.minFilter = sampler.minFilter;
    texture.wrapS = sampler.wrapS;
    texture.wrapT = sampler.wrapT;
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
  }

  texture.offset.fromArray(initialProps.offset);
  texture.rotation = initialProps.rotation;
  texture.repeat.fromArray(initialProps.scale);
  texture.needsUpdate = true;

  const localTexture: LocalTextureResource = {
    resourceId,
    texture,
    sharedTexture,
    forceUpdate: true, // TODO: Is this uploading the texture twice?
  };

  rendererModule.textures.push(localTexture);

  return localTexture;
}

export function updateLocalTextureResources(textures: LocalTextureResource[]) {
  for (let i = 0; i < textures.length; i++) {
    const { texture, sharedTexture, forceUpdate } = textures[i];
    const props = getReadObjectBufferView(sharedTexture);

    if (props.needsUpdate[0] || forceUpdate) {
      texture.offset.fromArray(props.offset);
      texture.rotation = props.rotation[0];
      texture.repeat.fromArray(props.scale);
      texture.needsUpdate = true;
    }
  }
}
