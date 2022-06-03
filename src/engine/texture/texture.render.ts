import { DataTexture, Texture } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import { defineModule, getModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { registerResourceLoader, waitForLocalResource } from "../resource/resource.render";
import {
  RGBETextureResourceProps,
  RGBETextureResourceType,
  TextureResourceProps,
  TextureResourceType,
} from "./texture.common";

interface TextureModuleState {
  rgbeLoader: RGBELoader;
}

export const TextureModule = defineModule<RenderThreadState, TextureModuleState>({
  name: "texture",
  create() {
    return {
      rgbeLoader: new RGBELoader(),
    };
  },
  init(ctx) {
    const disposables = [
      registerResourceLoader(ctx, TextureResourceType, onLoadTexture),
      registerResourceLoader(ctx, RGBETextureResourceType, onLoadRGBETexture),
    ];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadTexture(ctx: RenderThreadState, id: ResourceId, props: TextureResourceProps): Promise<Texture> {
  const image = await waitForLocalResource<ImageBitmap>(ctx, props.image);

  // TODO: Add ImageBitmap to Texture types
  const texture = new Texture(image as any);

  if (props.name) {
    texture.name = props.name;
  }

  texture.needsUpdate = true;

  return texture;
}

async function onLoadRGBETexture(
  ctx: RenderThreadState,
  id: ResourceId,
  props: RGBETextureResourceProps
): Promise<DataTexture> {
  const { rgbeLoader } = getModule(ctx, TextureModule);

  const texture = await rgbeLoader.loadAsync(props.uri);

  if (props.name) {
    texture.name = props.name;
  }

  return texture;
}
