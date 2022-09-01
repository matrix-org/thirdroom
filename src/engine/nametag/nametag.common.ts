import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";

export const NametagResourceType = "nametag";

export const nametagSchema = defineObjectBufferSchema({
  screenX: [Float32Array, 1],
  screenY: [Float32Array, 1],
  distanceFromCamera: [Float32Array, 1],
  inFrustum: [Uint8Array, 1],
});

export type NametagTripleBuffer = ObjectTripleBuffer<typeof nametagSchema>;

export type SharedNametagResource = {
  name: string;
  tripleBuffer: NametagTripleBuffer;
};
