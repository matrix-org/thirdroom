import { defineObjectBufferSchema } from "../allocator/ObjectBufferView";

export const NodeResourceType = "node";

export const rendererNodeSchema = defineObjectBufferSchema({
  visible: [Uint8Array, 1],
  interpolate: [Uint8Array, 1],
  worldMatrix: [Float32Array, 16],
  mesh: [Uint32Array, 1],
  light: [Uint32Array, 1],
  camera: [Uint32Array, 1],
});

export const audioNodeSchema = defineObjectBufferSchema({
  enabled: [Uint8Array, 1],
  interpolate: [Uint8Array, 1],
  worldMatrix: [Float32Array, 16],
  audioEmitter: [Uint32Array, 1],
});
