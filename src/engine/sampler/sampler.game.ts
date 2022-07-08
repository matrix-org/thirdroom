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
  name: string;
  resourceId: ResourceId;
}

export interface SamplerProps {
  name?: string;
  magFilter?: SamplerMagFilter;
  minFilter?: SamplerMinFilter;
  wrapS?: SamplerWrap;
  wrapT?: SamplerWrap;
  mapping?: SamplerMapping;
}

const DEFAULT_SAMPLER_NAME = "Sampler";

export function createRemoteSampler(ctx: GameState, props: SamplerProps): RemoteSampler {
  const name = props.name || DEFAULT_SAMPLER_NAME;

  return {
    name,
    resourceId: createResource<SharedSamplerResource>(
      ctx,
      Thread.Render,
      SamplerResourceType,
      {
        wrapS: props.wrapS || SamplerWrap.REPEAT,
        wrapT: props.wrapT || SamplerWrap.REPEAT,
        mapping: props.mapping === undefined ? SamplerMapping.UVMapping : props.mapping,
        magFilter: props.magFilter,
        minFilter: props.minFilter,
      },
      {
        name,
      }
    ),
  };
}
