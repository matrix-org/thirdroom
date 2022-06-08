import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import {
  SamplerMagFilter,
  SamplerMinFilter,
  SamplerResourceType,
  SamplerWrap,
  SharedSamplerResource,
} from "./sampler.common";

export interface RemoteSampler {
  resourceId: ResourceId;
}

export interface SamplerProps {
  magFilter?: SamplerMagFilter;
  minFilter?: SamplerMinFilter;
  wrapS?: SamplerWrap;
  wrapT?: SamplerWrap;
}

export function createRemoteSampler(ctx: GameState, props: SamplerProps): RemoteSampler {
  return {
    resourceId: createResource<SharedSamplerResource>(ctx, Thread.Render, SamplerResourceType, {
      wrapS: SamplerWrap.REPEAT,
      wrapT: SamplerWrap.REPEAT,
      ...props,
    }),
  };
}
