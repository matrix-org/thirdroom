import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";

export const NodeResourceType = "node";

export const rendererNodeSchema = defineObjectBufferSchema({
  visible: [Uint8Array, 1],
  static: [Uint8Array, 1],
  worldMatrix: [Float32Array, 16],
  mesh: [Uint32Array, 1],
  instancedMesh: [Uint32Array, 1],
  skinnedMesh: [Uint32Array, 1],
  light: [Uint32Array, 1],
  camera: [Uint32Array, 1],
  tilesRenderer: [Uint32Array, 1],
});

export const audioNodeSchema = defineObjectBufferSchema({
  enabled: [Uint8Array, 1],
  static: [Uint8Array, 1],
  worldMatrix: [Float32Array, 16],
  audioEmitter: [Uint32Array, 1],
});

export type RendererNodeTripleBuffer = ObjectTripleBuffer<typeof rendererNodeSchema>;

export type AudioNodeTripleBuffer = ObjectTripleBuffer<typeof audioNodeSchema>;

export type RendererSharedNodeResource = {
  rendererNodeTripleBuffer: RendererNodeTripleBuffer;
};

export type AudioSharedNodeResource = {
  audioNodeTripleBuffer: AudioNodeTripleBuffer;
};
