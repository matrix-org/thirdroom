import { defineObjectBufferSchema } from "../allocator/ObjectBufferView";
import { maxEntities } from "../config.common";

export const worldMatrixObjectBufferSchema = defineObjectBufferSchema({
  worldMatrix: [Float32Array, maxEntities, 16],
  worldMatrixNeedsUpdate: [Uint8Array, maxEntities],
});

export const hierarchyObjectBufferSchema = defineObjectBufferSchema({
  parent: [Uint32Array, maxEntities],
  firstChild: [Uint32Array, maxEntities],
  prevSibling: [Uint32Array, maxEntities],
  nextSibling: [Uint32Array, maxEntities],
  hierarchyUpdated: [Uint8Array, maxEntities],
});
