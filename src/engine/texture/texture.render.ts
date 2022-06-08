import { LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, Texture, TextureEncoding } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { ImageFormat, LocalImageResource } from "../image/image.render";
import { defineModule, getModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { registerResourceLoader, waitForLocalResource } from "../resource/resource.render";
import { LocalSamplerResource } from "../sampler/sampler.render";
import { SharedTexture, SharedTextureResource, TextureResourceType } from "./texture.common";

interface LocalTextureResource {
  forceUpdate: boolean;
  texture: Texture;
  sharedTexture: SharedTexture;
}

interface TextureModuleState {
  textures: LocalTextureResource[];
}

export const TextureModule = defineModule<RenderThreadState, TextureModuleState>({
  name: "texture",
  create() {
    return {
      textures: [],
    };
  },
  init(ctx) {
    const disposables = [registerResourceLoader(ctx, TextureResourceType, onLoadTexture)];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadTexture(
  ctx: RenderThreadState,
  id: ResourceId,
  { initialProps, sharedTexture }: SharedTextureResource
): Promise<Texture> {
  const textureModule = getModule(ctx, TextureModule);

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

  textureModule.textures.push({
    texture,
    sharedTexture,
    forceUpdate: true, // TODO: Is this uploading the texture twice?
  });

  return texture;
}

export function TextureUpdateSystem(ctx: RenderThreadState) {
  const textureModule = getModule(ctx, TextureModule);

  for (let i = 0; i < textureModule.textures.length; i++) {
    const { texture, sharedTexture, forceUpdate } = textureModule.textures[i];
    const props = getReadObjectBufferView(sharedTexture);

    if (props.needsUpdate[0] || forceUpdate) {
      texture.offset.fromArray(props.offset);
      texture.rotation = props.rotation[0];
      texture.repeat.fromArray(props.scale);
      texture.needsUpdate = true;
    }
  }
}
