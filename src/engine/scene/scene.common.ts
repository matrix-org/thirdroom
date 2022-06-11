import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";

export const SceneResourceType = "scene";

export const rendererSceneSchema = defineObjectBufferSchema({
  background: [Uint32Array, 1],
  environment: [Uint32Array, 1],
});

export const audioSceneSchema = defineObjectBufferSchema({
  audioListener: [Uint32Array, 1],
  audioEmitters: [Uint32Array, 16],
});

export type RendererSceneTripleBuffer = ObjectTripleBuffer<typeof rendererSceneSchema>;

export type AudioSceneTripleBuffer = ObjectTripleBuffer<typeof audioSceneSchema>;

export interface RendererSceneResourceProps {
  background: ResourceId;
  environment: ResourceId;
}

export type RendererSharedSceneResource = {
  initialProps: RendererSceneResourceProps;
  rendererSceneTripleBuffer: RendererSceneTripleBuffer;
};

export interface AudioSceneResourceProps {
  audioListener: ResourceId;
  audioEmitters: ResourceId[];
}

export type AudioSharedSceneResource = {
  initialProps: AudioSceneResourceProps;
  audioSceneTripleBuffer: AudioSceneTripleBuffer;
};
