import { vec2 } from "gl-matrix";

import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";
import { MeshPrimitiveMode } from "../resource/schema";

export const MeshResourceType = "old-mesh";
export const MeshPrimitiveResourceType = "old-mesh-primitive";
export const InstancedMeshResourceType = "instanced-mesh";
export const LightMapResourceType = "light-map";
export const SkinnedMeshResourceType = "skinned-mesh";

export interface PrimitiveResourceProps {
  attributes: { [key: string]: ResourceId };
  indices?: ResourceId;
  mode: MeshPrimitiveMode;
}

export interface MeshResourceProps {
  primitives: ResourceId[];
}

export interface SharedMeshResource {
  initialProps: MeshResourceProps;
}

export interface SharedInstancedMeshResource {
  attributes: { [key: string]: ResourceId };
}

export interface SharedLightMapResource {
  texture: ResourceId;
  offset: vec2;
  scale: vec2;
  intensity: number;
}

export interface SharedSkinnedMeshResource {
  joints: ResourceId[];
  inverseBindMatrices?: ResourceId;
}

export const meshPrimitiveSchema = defineObjectBufferSchema({
  material: [Uint32Array, 1],
});

export type MeshPrimitiveTripleBuffer = ObjectTripleBuffer<typeof meshPrimitiveSchema>;

export interface SharedMeshPrimitiveResource {
  initialProps: PrimitiveResourceProps;
  meshPrimitiveTripleBuffer: MeshPrimitiveTripleBuffer;
}

export enum MeshPrimitiveAttribute {
  POSITION = "POSITION",
  NORMAL = "NORMAL",
  TANGENT = "TANGENT",
  TEXCOORD_0 = "TEXCOORD_0",
  TEXCOORD_1 = "TEXCOORD_1",
  COLOR_0 = "COLOR_0",
  JOINTS_0 = "JOINTS_0",
  WEIGHTS_0 = "WEIGHTS_0",
}

export enum InstancedMeshAttribute {
  TRANSLATION = "TRANSLATION",
  ROTATION = "ROTATION",
  SCALE = "SCALE",
  LIGHTMAP_OFFSET = "_LIGHTMAP_OFFSET",
  LIGHTMAP_SCALE = "_LIGHTMAP_SCALE",
}
