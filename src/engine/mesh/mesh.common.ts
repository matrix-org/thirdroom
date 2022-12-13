import { vec2 } from "gl-matrix";

import { ResourceId } from "../resource/resource.common";

export const LightMapResourceType = "light-map";

export interface SharedLightMapResource {
  texture: ResourceId;
  offset: vec2;
  scale: vec2;
  intensity: number;
}
