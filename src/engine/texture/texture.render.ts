import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  RepeatWrapping,
  Texture,
  TextureEncoding,
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { defineModule, getModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { registerResourceLoader, waitForLocalResource } from "../resource/resource.render";
import {
  RGBATextureResourceType,
  RGBETextureResourceType,
  SharedRGBATextureResource,
  SharedRGBETextureResource,
  SharedTexture,
  TextureType,
} from "./texture.common";

interface LocalTextureResource {
  type: TextureType;
  forceUpdate: boolean;
  texture: Texture;
  sharedTexture: SharedTexture;
}

interface TextureModuleState {
  rgbeLoader: RGBELoader;
  textures: LocalTextureResource[];
}

const ThreeFilters = {
  9728: NearestFilter,
  9729: LinearFilter,
  9984: NearestMipmapNearestFilter,
  9985: LinearMipmapNearestFilter,
  9986: NearestMipmapLinearFilter,
  9987: LinearMipmapLinearFilter,
};

const ThreeWrappings = {
  33071: ClampToEdgeWrapping,
  33648: MirroredRepeatWrapping,
  10497: RepeatWrapping,
};

export const TextureModule = defineModule<RenderThreadState, TextureModuleState>({
  name: "texture",
  create() {
    return {
      rgbeLoader: new RGBELoader(),
      textures: [],
    };
  },
  init(ctx) {
    const disposables = [
      registerResourceLoader(ctx, RGBATextureResourceType, onLoadTexture),
      registerResourceLoader(ctx, RGBETextureResourceType, onLoadRGBETexture),
    ];

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
  { type, initialProps, sharedTexture }: SharedRGBATextureResource
): Promise<Texture> {
  const textureModule = getModule(ctx, TextureModule);

  const image = await waitForLocalResource<ImageBitmap>(ctx, initialProps.image);

  // TODO: Add ImageBitmap to Texture types
  const texture = new Texture(image as any);
  texture.flipY = false;
  texture.magFilter = ThreeFilters[initialProps.magFilter];
  texture.minFilter = ThreeFilters[initialProps.minFilter];
  texture.wrapS = ThreeWrappings[initialProps.wrapS];
  texture.wrapT = ThreeWrappings[initialProps.wrapT];
  texture.encoding = initialProps.encoding as unknown as TextureEncoding;
  texture.offset.fromArray(initialProps.offset);
  texture.rotation = initialProps.rotation;
  texture.repeat.fromArray(initialProps.scale);
  texture.needsUpdate = true;

  textureModule.textures.push({
    type,
    texture,
    sharedTexture,
    forceUpdate: true, // TODO: Is this uploading the texture twice?
  });

  return texture;
}

async function onLoadRGBETexture(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedTexture }: SharedRGBETextureResource
): Promise<DataTexture> {
  const textureModule = getModule(ctx, TextureModule);

  const texture = await textureModule.rgbeLoader.loadAsync(initialProps.uri);

  texture.offset.fromArray(initialProps.offset);
  texture.rotation = initialProps.rotation;
  texture.repeat.fromArray(initialProps.scale);
  texture.needsUpdate = true;

  textureModule.textures.push({
    type,
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
