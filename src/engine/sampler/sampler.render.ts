import {
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  RepeatWrapping,
  TextureFilter,
  Wrapping,
} from "three";

import { defineModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { registerResourceLoader } from "../resource/resource.render";
import { SamplerResourceType, SharedSamplerResource } from "./sampler.common";

export interface LocalSamplerResource {
  magFilter: TextureFilter;
  minFilter: TextureFilter;
  wrapS: Wrapping;
  wrapT: Wrapping;
}

type SamplerModuleState = {};

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

export const SamplerModule = defineModule<RenderThreadState, SamplerModuleState>({
  name: "sampler",
  create() {
    return {};
  },
  init(ctx) {
    const disposables = [registerResourceLoader(ctx, SamplerResourceType, onLoadSampler)];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadSampler(
  ctx: RenderThreadState,
  id: ResourceId,
  sampler: SharedSamplerResource
): Promise<LocalSamplerResource> {
  return {
    magFilter: sampler.magFilter ? ThreeFilters[sampler.magFilter] : LinearFilter,
    minFilter: sampler.minFilter ? ThreeFilters[sampler.minFilter] : LinearMipmapLinearFilter,
    wrapS: ThreeWrappings[sampler.wrapS],
    wrapT: ThreeWrappings[sampler.wrapT],
  };
}
