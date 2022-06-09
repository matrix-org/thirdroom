import { ResourceId } from "../resource/resource.common";

export const MeshResourceType = "mesh";

interface PrimitiveResourceProps {
  attributes: { [key: string]: ResourceId };
  indices?: ResourceId;
  material?: ResourceId;
  mode?: number;
  targets?: number[] | Float32Array;
}

export interface MeshResourceProps {
  primitives: PrimitiveResourceProps[];
  weights?: number[] | Float32Array;
}

export enum MeshMode {
  POINTS,
  LINES,
  LINE_LOOP,
  LINE_STRIP,
  TRIANGLES,
  TRIANGLE_STRIP,
  TRIANGLE_FAN,
}

export enum MeshAttribute {
  POSITION = "POSITION",
  NORMAL = "NORMAL",
  TANGENT = "TANGENT",
  TEXCOORD_0 = "TEXCOORD_0",
  TEXCOORD_1 = "TEXCOORD_1",
  COLOR_0 = "COLOR_0",
  JOINTS_0 = "JOINTS_0",
  WEIGHTS_0 = "WEIGHTS_0",
}
