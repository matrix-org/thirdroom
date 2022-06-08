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

export enum MeshAttribute {
  POSITION = "POSITION",
}
