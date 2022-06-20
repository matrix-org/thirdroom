import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";

export const DirectionalLightResourceType = "point-light";
export const PointLightResourceType = "directional-light";
export const SpotLightResourceType = "spot-light";

export const directionalLightSchema = defineObjectBufferSchema({
  color: [Float32Array, 3],
  intensity: [Float32Array, 1],
  castShadow: [Uint8Array, 1],
});

export const pointLightSchema = defineObjectBufferSchema({
  color: [Float32Array, 3],
  intensity: [Float32Array, 1],
  range: [Float32Array, 1],
  castShadow: [Uint8Array, 1],
});

export const spotLightSchema = defineObjectBufferSchema({
  color: [Float32Array, 3],
  intensity: [Float32Array, 1],
  range: [Float32Array, 1],
  innerConeAngle: [Float32Array, 1],
  outerConeAngle: [Float32Array, 1],
  castShadow: [Uint8Array, 1],
});

export enum LightType {
  Directional = "directional",
  Point = "point",
  Spot = "spot",
}

export type DirectionalLightTripleBuffer = ObjectTripleBuffer<typeof directionalLightSchema>;
export type PointLightTripleBuffer = ObjectTripleBuffer<typeof pointLightSchema>;
export type SpotLightTripleBuffer = ObjectTripleBuffer<typeof spotLightSchema>;

export interface SharedDirectionalLightResource {
  type: LightType.Directional;
  lightTripleBuffer: DirectionalLightTripleBuffer;
}

export interface SharedPointLightResource {
  type: LightType.Point;
  lightTripleBuffer: PointLightTripleBuffer;
}

export interface SharedSpotLightResource {
  type: LightType.Spot;
  lightTripleBuffer: SpotLightTripleBuffer;
}

export type SharedLightResource = SharedDirectionalLightResource | SharedPointLightResource | SharedSpotLightResource;
