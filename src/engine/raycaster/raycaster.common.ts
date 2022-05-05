import type { vec3 } from "gl-matrix";

export type RayId = number;

export interface RaycastResult {
  distance: number;
  point: vec3;
  entity: number;
}
