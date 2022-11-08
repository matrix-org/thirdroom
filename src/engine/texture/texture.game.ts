import { vec2 } from "gl-matrix";

import { GameState } from "../GameTypes";
import { RemoteImage } from "../image/image.game";
import { getModule, Thread } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { addResourceRef, createResource, disposeResource } from "../resource/resource.game";
import { RemoteSampler } from "../resource/schema";
import { TextureEncoding, SharedTextureResource, TextureResourceType } from "./texture.common";

export interface RemoteTexture {
  name: string;
  resourceId: ResourceId;
  image: RemoteImage;
}

export interface TextureProps {
  name?: string;
  image: RemoteImage;
  sampler?: RemoteSampler;
  encoding?: TextureEncoding;
  offset?: vec2;
  rotation?: number;
  scale?: vec2;
}

const DEFAULT_TEXTURE_NAME = "Texture";

export function createRemoteTexture(ctx: GameState, props: TextureProps): RemoteTexture {
  const rendererModule = getModule(ctx, RendererModule);

  const imageResourceId = props.image.resourceId;
  const samplerResourceId = props.sampler?.resourceId;

  const initialProps = {
    encoding: props.encoding || TextureEncoding.Linear,
    image: imageResourceId,
    sampler: samplerResourceId,
  };

  const name = props?.name || DEFAULT_TEXTURE_NAME;

  addResourceRef(ctx, imageResourceId);

  if (samplerResourceId !== undefined) {
    addResourceRef(ctx, samplerResourceId);
  }

  const resourceId = createResource<SharedTextureResource>(
    ctx,
    Thread.Render,
    TextureResourceType,
    {
      initialProps,
    },
    {
      name,
      dispose() {
        disposeResource(ctx, imageResourceId);

        if (samplerResourceId !== undefined) {
          disposeResource(ctx, samplerResourceId);
        }

        const index = rendererModule.textures.findIndex((texture) => texture.resourceId === resourceId);

        if (index !== -1) {
          rendererModule.textures.splice(index, 1);
        }
      },
    }
  );

  const remoteTexture: RemoteTexture = {
    name,
    resourceId,
    image: props.image,
  };

  rendererModule.textures.push(remoteTexture);

  return remoteTexture;
}
