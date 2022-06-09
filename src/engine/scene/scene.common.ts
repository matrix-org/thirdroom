import { defineObjectBufferSchema, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";

export const SceneResourceType = "scene";

export const rendererSceneSchema = defineObjectBufferSchema({
  background: [Uint32Array, 1],
  environment: [Uint32Array, 1],
  needsUpdate: [Uint8Array, 1],
});

export const audioSceneSchema = defineObjectBufferSchema({
  audioListener: [Uint32Array, 1],
  audioEmitters: [Uint32Array, 16],
});

export type RendererSharedScene = TripleBufferBackedObjectBufferView<typeof rendererSceneSchema, ArrayBuffer>;

export type AudioSharedScene = TripleBufferBackedObjectBufferView<typeof audioSceneSchema, ArrayBuffer>;

export interface RendererSceneResourceProps {
  background: ResourceId;
  environment: ResourceId;
}

export type RendererSharedSceneResource = {
  initialProps: RendererSceneResourceProps;
  sharedScene: RendererSharedScene;
};

export interface AudioSceneResourceProps {
  audioListener: ResourceId;
  audioEmitters: ResourceId[];
}

export type AudioSharedSceneResource = {
  initialProps: AudioSceneResourceProps;
  sharedScene: AudioSharedScene;
};
