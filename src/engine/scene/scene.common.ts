import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";

export const SceneResourceType = "scene";

export const rendererSceneSchema = defineObjectBufferSchema({
  backgroundTexture: [Uint32Array, 1],
  reflectionProbe: [Uint32Array, 1],
  bloomStrength: [Float32Array, 1],
});

export const audioSceneSchema = defineObjectBufferSchema({
  audioEmitters: [Uint32Array, 16],
});

export type RendererSceneTripleBuffer = ObjectTripleBuffer<typeof rendererSceneSchema>;

export type AudioSceneTripleBuffer = ObjectTripleBuffer<typeof audioSceneSchema>;

export type RendererSharedSceneResource = {
  rendererSceneTripleBuffer: RendererSceneTripleBuffer;
};

export type AudioSharedSceneResource = {
  audioSceneTripleBuffer: AudioSceneTripleBuffer;
};
