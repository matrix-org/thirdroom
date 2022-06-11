import { vec2 } from "gl-matrix";

import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { RemoteImage } from "../image/image.game";
import { getModule, Thread } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import { RemoteSampler } from "../sampler/sampler.game";
import {
  TextureTripleBuffer,
  textureSchema,
  TextureEncoding,
  SharedTextureResource,
  TextureResourceType,
} from "./texture.common";

export type TextureBufferView = ObjectBufferView<typeof textureSchema, ArrayBuffer>;

export interface RemoteTexture {
  resourceId: ResourceId;
  textureBufferView: TextureBufferView;
  textureTripleBuffer: TextureTripleBuffer;
  image: RemoteImage;
  get offset(): vec2;
  set offset(value: vec2);
  get rotation(): number;
  set rotation(value: number);
  get scale(): vec2;
  set scale(value: vec2);
}

export interface TextureProps {
  sampler?: RemoteSampler;
  encoding?: TextureEncoding;
  offset?: vec2;
  rotation?: number;
  scale?: vec2;
}

export function createRemoteTexture(ctx: GameState, image: RemoteImage, props?: TextureProps): RemoteTexture {
  const rendererModule = getModule(ctx, RendererModule);

  const textureBufferView = createObjectBufferView(textureSchema, ArrayBuffer);

  const initialProps = {
    encoding: props?.encoding || TextureEncoding.Linear,
    image: image.resourceId,
    sampler: props?.sampler ? props.sampler.resourceId : undefined,
  };

  textureBufferView.offset.set(props?.offset || [0, 0]);
  textureBufferView.rotation[0] = props?.rotation || 0;
  textureBufferView.scale.set(props?.scale || [1, 1]);

  const textureTripleBuffer = createObjectTripleBuffer(textureSchema, ctx.gameToMainTripleBufferFlags);

  const resourceId = createResource<SharedTextureResource>(ctx, Thread.Render, TextureResourceType, {
    initialProps,
    textureTripleBuffer,
  });

  const remoteTexture: RemoteTexture = {
    resourceId,
    textureBufferView,
    textureTripleBuffer,
    image,
    get offset(): vec2 {
      return textureBufferView.offset;
    },
    set offset(value: vec2) {
      textureBufferView.offset.set(value);
    },
    get rotation(): number {
      return textureBufferView.rotation[0];
    },
    set rotation(value: number) {
      textureBufferView.rotation[0] = value;
    },
    get scale(): vec2 {
      return textureBufferView.scale;
    },
    set scale(value: vec2) {
      textureBufferView.scale.set(value);
    },
  };

  rendererModule.textures.push(remoteTexture);

  return remoteTexture;
}

export function updateRemoteTextures(textures: RemoteTexture[]) {
  for (let i = 0; i < textures.length; i++) {
    const texture = textures[i];
    commitToObjectTripleBuffer(texture.textureTripleBuffer, texture.textureBufferView);
  }
}
