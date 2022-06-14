import {
  ClampToEdgeWrapping,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CubeUVReflectionMapping,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  Mapping,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  RepeatWrapping,
  TextureFilter,
  UVMapping,
  Wrapping,
} from "three";

import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { SamplerMapping, SharedSamplerResource } from "./sampler.common";

export interface LocalSamplerResource {
  magFilter: TextureFilter;
  minFilter: TextureFilter;
  wrapS: Wrapping;
  wrapT: Wrapping;
  mapping: Mapping;
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

const ThreeMapping = {
  [SamplerMapping.UVMapping]: UVMapping,
  [SamplerMapping.CubeReflectionMapping]: CubeReflectionMapping,
  [SamplerMapping.CubeRefractionMapping]: CubeRefractionMapping,
  [SamplerMapping.EquirectangularReflectionMapping]: EquirectangularReflectionMapping,
  [SamplerMapping.EquirectangularRefractionMapping]: EquirectangularRefractionMapping,
  [SamplerMapping.CubeUVReflectionMapping]: CubeUVReflectionMapping,
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
    mapping: ThreeMapping[sampler.mapping],
  };
}
