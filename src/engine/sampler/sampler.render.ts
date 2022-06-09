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

import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { SharedSamplerResource } from "./sampler.common";

export interface LocalSamplerResource {
  magFilter: TextureFilter;
  minFilter: TextureFilter;
  wrapS: Wrapping;
  wrapT: Wrapping;
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

export async function onLoadSampler(
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
