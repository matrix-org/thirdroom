import { vec2 } from "gl-matrix";

import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { RemoteImage } from "../image/image.game";
import { getModule, Thread } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import { RemoteSampler } from "../sampler/sampler.game";
import {
  SharedTexture,
  textureSchema,
  TextureEncoding,
  SharedTextureResource,
  TextureResourceType,
} from "./texture.common";

export interface RemoteTexture {
  resourceId: ResourceId;
  sharedTexture: SharedTexture;
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

  const texture = createObjectBufferView(textureSchema, ArrayBuffer);

  const initialProps = {
    encoding: props?.encoding || TextureEncoding.Linear,
    offset: props?.offset || [0, 0],
    rotation: props?.rotation || 0,
    scale: props?.scale || [1, 1],
    image: image.resourceId,
    sampler: props?.sampler ? props.sampler.resourceId : undefined,
  };

  texture.offset.set(initialProps.offset);
  texture.rotation[0] = initialProps.rotation;
  texture.scale.set(initialProps.scale);

  const sharedTexture = createTripleBufferBackedObjectBufferView(
    textureSchema,
    texture,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedTextureResource>(ctx, Thread.Render, TextureResourceType, {
    initialProps,
    sharedTexture,
  });

  const remoteTexture: RemoteTexture = {
    resourceId,
    sharedTexture,
    image,
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

  rendererModule.textures.push(remoteTexture);

  return remoteTexture;
}

export function updateRemoteTextures(textures: RemoteTexture[]) {
  for (let i = 0; i < textures.length; i++) {
    const texture = textures[i];
    commitToObjectTripleBuffer(texture.sharedTexture);
    texture.sharedTexture.needsUpdate[0] = 0;
  }
}
