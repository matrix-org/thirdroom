import { vec3 } from "gl-matrix";

import { defineObjectBufferSchema, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";

export const DirectionalLightResourceType = "point-light";
export const PointLightResourceType = "directional-light";
export const SpotLightResourceType = "spot-light";

export const directionalLightSchema = defineObjectBufferSchema({
  color: [Float32Array, 3],
  intensity: [Float32Array, 1],
  castShadow: [Uint8Array, 1],
  needsUpdate: [Uint8Array, 1],
});

export const pointLightSchema = defineObjectBufferSchema({
  color: [Float32Array, 3],
  intensity: [Float32Array, 1],
  range: [Float32Array, 1],
  castShadow: [Uint8Array, 1],
  needsUpdate: [Uint8Array, 1],
});

export const spotLightSchema = defineObjectBufferSchema({
  color: [Float32Array, 3],
  intensity: [Float32Array, 1],
  range: [Float32Array, 1],
  innerConeAngle: [Float32Array, 1],
  outerConeAngle: [Float32Array, 1],
  castShadow: [Uint8Array, 1],
  needsUpdate: [Uint8Array, 1],
});

export enum LightType {
  Directional = "directional",
  Point = "point",
  Spot = "spot",
}

export interface DirectionalLightResourceProps {
  color?: vec3;
  intensity?: number;
  castShadow?: boolean;
}

export interface PointLightResourceProps {
  color?: vec3;
  intensity?: number;
  range?: number;
  castShadow?: boolean;
}

export interface SpotLightResourceProps {
  color?: vec3;
  intensity?: number;
  range?: number;
  innerConeAngle?: number;
  outerConeAngle?: number;
  castShadow?: boolean;
}

export type LightResourceProps = DirectionalLightResourceProps | PointLightResourceProps | SpotLightResourceProps;

export type SharedDirectionalLight = TripleBufferBackedObjectBufferView<typeof directionalLightSchema, ArrayBuffer>;
export type SharedPointLight = TripleBufferBackedObjectBufferView<typeof pointLightSchema, ArrayBuffer>;
export type SharedSpotLight = TripleBufferBackedObjectBufferView<typeof spotLightSchema, ArrayBuffer>;

export interface SharedDirectionalLightResource {
  type: LightType.Directional;
  initialProps: Required<DirectionalLightResourceProps>;
  sharedLight: SharedDirectionalLight;
}

export interface SharedPointLightResource {
  type: LightType.Point;
  initialProps: Required<PointLightResourceProps>;
  sharedLight: SharedPointLight;
}

export interface SharedSpotLightResource {
  type: LightType.Spot;
  initialProps: Required<SpotLightResourceProps>;
  sharedLight: SharedSpotLight;
}

export type SharedLightResource = SharedDirectionalLightResource | SharedPointLightResource | SharedSpotLightResource;
