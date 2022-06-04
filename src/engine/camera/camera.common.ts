import { defineObjectBufferSchema, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";

export const PerspectiveCameraResourceType = "perspective-camera";
export const OrthographicCameraResourceType = "orthographic-camera";

export const orthographicCameraSchema = defineObjectBufferSchema({
  layers: [Uint32Array, 1],
  // https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/schema/camera.orthographic.schema.json
  zfar: [Float32Array, 1],
  znear: [Float32Array, 1],
  xmag: [Float32Array, 1],
  ymag: [Float32Array, 1],
  projectionMatrixNeedsUpdate: [Uint8Array, 1],
  needsUpdate: [Uint8Array, 1],
});

export const perspectiveCameraSchema = defineObjectBufferSchema({
  layers: [Uint32Array, 1],
  // https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/schema/camera.perspective.schema.json
  zfar: [Float32Array, 1],
  znear: [Float32Array, 1],
  aspectRatio: [Float32Array, 1],
  yfov: [Float32Array, 1],
  projectionMatrixNeedsUpdate: [Uint8Array, 1],
  needsUpdate: [Uint8Array, 1],
});

export enum CameraType {
  Perspective = "perspective",
  Orthographic = "orthographic",
}

export interface PerspectiveCameraResourceProps {
  layers?: number;
  aspectRatio?: number;
  yfov: number;
  zfar?: number;
  znear: number;
}

export interface OrthographicCameraResourceProps {
  layers?: number;
  xmag: number;
  ymag: number;
  zfar: number;
  znear: number;
}

export type CameraResourceProps = PerspectiveCameraResourceProps | OrthographicCameraResourceProps;

export interface SharedPerspectiveCameraResource {
  eid: number;
  type: CameraType.Perspective;
  initialProps: Required<PerspectiveCameraResourceProps>;
  sharedCamera: TripleBufferBackedObjectBufferView<typeof perspectiveCameraSchema, ArrayBuffer>;
}

export interface SharedOrthographicCameraResource {
  eid: number;
  type: CameraType.Orthographic;
  initialProps: Required<OrthographicCameraResourceProps>;
  sharedCamera: TripleBufferBackedObjectBufferView<typeof orthographicCameraSchema, ArrayBuffer>;
}

export type SharedCameraResource = SharedPerspectiveCameraResource | SharedOrthographicCameraResource;
