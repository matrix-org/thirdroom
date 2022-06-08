export const SamplerResourceType = "sampler";

export enum SamplerMagFilter {
  NEAREST = 9728,
  LINEAR = 9729,
}

export enum SamplerMinFilter {
  NEAREST = 9728,
  LINEAR = 9729,
  NEAREST_MIPMAP_NEAREST = 9984,
  LINEAR_MIPMAP_NEAREST = 9985,
  NEAREST_MIPMAP_LINEAR = 9986,
  LINEAR_MIPMAP_LINEAR = 9987,
}

export enum SamplerWrap {
  CLAMP_TO_EDGE = 33071,
  MIRRORED_REPEAT = 33648,
  REPEAT = 10497,
}

export interface SharedSamplerResource {
  magFilter?: SamplerMagFilter;
  minFilter?: SamplerMinFilter;
  wrapS: SamplerWrap;
  wrapT: SamplerWrap;
}
