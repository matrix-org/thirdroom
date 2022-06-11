import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";

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
});

export const perspectiveCameraSchema = defineObjectBufferSchema({
  layers: [Uint32Array, 1],
  // https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/schema/camera.perspective.schema.json
  zfar: [Float32Array, 1],
  znear: [Float32Array, 1],
  aspectRatio: [Float32Array, 1],
  yfov: [Float32Array, 1],
  projectionMatrixNeedsUpdate: [Uint8Array, 1],
});

export type PerspectiveCameraTripleBuffer = ObjectTripleBuffer<typeof perspectiveCameraSchema>;
export type OrthographicCameraTripleBuffer = ObjectTripleBuffer<typeof orthographicCameraSchema>;

export enum CameraType {
  Perspective = "perspective",
  Orthographic = "orthographic",
}

export interface SharedPerspectiveCameraResource {
  type: CameraType.Perspective;
  cameraTripleBuffer: PerspectiveCameraTripleBuffer;
}

export interface SharedOrthographicCameraResource {
  type: CameraType.Orthographic;
  cameraTripleBuffer: OrthographicCameraTripleBuffer;
}

export type SharedCameraResource = SharedPerspectiveCameraResource | SharedOrthographicCameraResource;
