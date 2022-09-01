import { vec3 } from "gl-matrix";

import { ResourceId } from "../resource/resource.common";

export const ReflectionProbeResourceType = "reflection-probe";

export interface SharedReflectionProbeResource {
  reflectionProbeTexture: ResourceId;
  size?: vec3;
}
