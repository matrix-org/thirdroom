import { Mesh, Line, LineSegments, Points, LineLoop, SkinnedMesh } from "three";

import { MeshPrimitiveAttributeIndex } from "../resource/schema";

export type PrimitiveObject3D = SkinnedMesh | Mesh | Line | LineSegments | LineLoop | Points;

export const MeshPrimitiveAttributeToThreeAttribute: { [key: number]: string } = {
  [MeshPrimitiveAttributeIndex.POSITION]: "position",
  [MeshPrimitiveAttributeIndex.NORMAL]: "normal",
  [MeshPrimitiveAttributeIndex.TANGENT]: "tangent",
  [MeshPrimitiveAttributeIndex.TEXCOORD_0]: "uv",
  [MeshPrimitiveAttributeIndex.TEXCOORD_1]: "uv2",
  [MeshPrimitiveAttributeIndex.COLOR_0]: "color",
  [MeshPrimitiveAttributeIndex.JOINTS_0]: "skinIndex",
  [MeshPrimitiveAttributeIndex.WEIGHTS_0]: "skinWeight",
};
