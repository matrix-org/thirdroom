import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import {
  SamplerMagFilter,
  SamplerMapping,
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
  mapping?: SamplerMapping;
}

export function createRemoteSampler(ctx: GameState, props: SamplerProps): RemoteSampler {
  return {
    resourceId: createResource<SharedSamplerResource>(ctx, Thread.Render, SamplerResourceType, {
      wrapS: props.wrapS || SamplerWrap.REPEAT,
      wrapT: props.wrapT || SamplerWrap.REPEAT,
      mapping: props.mapping === undefined ? SamplerMapping.UVMapping : props.mapping,
      magFilter: props.magFilter,
      minFilter: props.minFilter,
    }),
  };
}
