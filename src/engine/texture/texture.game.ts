import { vec2 } from "gl-matrix";

import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import {
  RGBATextureResourceProps,
  RGBATextureResourceType,
  RGBETextureResourceProps,
  RGBETextureResourceType,
  SharedTexture,
  TextureMagFilter,
  TextureMinFilter,
  textureSchema,
  TextureType,
  TextureWrap,
  TextureEncoding,
  TextureResourceProps,
  SharedTextureResource,
} from "./texture.common";

export interface RemoteTexture {
  resourceId: ResourceId;
  type: TextureType;
  sharedTexture: SharedTexture;
  get offset(): vec2;
  set offset(value: vec2);
  get rotation(): number;
  set rotation(value: number);
  get scale(): vec2;
  set scale(value: vec2);
}

export interface TextureModuleState {
  textures: RemoteTexture[];
}

export const TextureModule = defineModule<GameState, TextureModuleState>({
  name: "texture",
  create() {
    return {
      textures: [],
    };
  },
  init() {},
});

export function TextureUpdateSystem(ctx: GameState) {
  const { textures } = getModule(ctx, TextureModule);

  for (let i = 0; i < textures.length; i++) {
    const texture = textures[i];
    commitToTripleBufferView(texture.sharedTexture);
    texture.sharedTexture.needsUpdate[0] = 0;
  }
}

export function createRGBATexture(ctx: GameState, props: RGBATextureResourceProps): RemoteTexture {
  return createTexture<RGBATextureResourceProps>(ctx, TextureType.RGBA, RGBATextureResourceType, props);
}

export function createRGBETexture(ctx: GameState, props: RGBETextureResourceProps): RemoteTexture {
  return createTexture<RGBETextureResourceProps>(ctx, TextureType.RGBE, RGBETextureResourceType, props);
}

function createTexture<Props extends TextureResourceProps>(
  ctx: GameState,
  type: TextureType,
  resourceType: string,
  props: Props
): RemoteTexture {
  const textureModule = getModule(ctx, TextureModule);

  const texture = createObjectBufferView(textureSchema, ArrayBuffer);

  const initialProps = Object.assign(
    {
      magFilter: TextureMagFilter.LINEAR,
      minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
      wrapS: TextureWrap.REPEAT,
      wrapT: TextureWrap.REPEAT,
      encoding: TextureEncoding.Linear,
      offset: [0, 0],
      rotation: 0,
      scale: [1, 1],
    },
    props
  ) as Required<Props>;

  texture.offset.set(initialProps.offset!);
  texture.rotation[0] = initialProps.rotation!;
  texture.scale.set(initialProps.scale!);

  const sharedTexture = createTripleBufferBackedObjectBufferView(
    textureSchema,
    texture,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedTextureResource>(ctx, resourceType, {
    type,
    initialProps: initialProps as any,
    sharedTexture,
  });

  const remoteTexture: RemoteTexture = {
    resourceId,
    type,
    sharedTexture,
    get offset(): vec2 {
      return texture.offset;
    },
    set offset(value: vec2) {
      texture.offset.set(value);
      texture.needsUpdate[0] = 1;
    },
    get rotation(): number {
      return texture.rotation[0];
    },
    set rotation(value: number) {
      texture.rotation[0] = value;
      texture.needsUpdate[0] = 1;
    },
    get scale(): vec2 {
      return texture.scale;
    },
    set scale(value: vec2) {
      texture.scale.set(value);
      texture.needsUpdate[0] = 1;
    },
  };

  textureModule.textures.push(remoteTexture);

  return remoteTexture;
}
