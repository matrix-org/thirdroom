import { defineObjectBufferSchema, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";

export const SceneResourceType = "scene";

export const sceneSchema = defineObjectBufferSchema({
  background: [Uint32Array, 1],
  environment: [Uint32Array, 1],
  needsUpdate: [Uint8Array, 1],
});

export interface SceneResourceProps {
  background?: ResourceId;
  environment?: ResourceId;
}

export type SharedSceneResource = {
  eid: number;
  initialProps?: SceneResourceProps;
  sharedScene: TripleBufferBackedObjectBufferView<typeof sceneSchema, ArrayBuffer>;
};
