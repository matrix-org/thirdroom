import { defineObjectBufferSchema } from "../allocator/ObjectBufferView";
import { maxEntities } from "../config.common";

export const hierarchyObjectBufferSchema = defineObjectBufferSchema({
  parent: [Uint32Array, maxEntities],
  firstChild: [Uint32Array, maxEntities],
  prevSibling: [Uint32Array, maxEntities],
  nextSibling: [Uint32Array, maxEntities],
  hierarchyUpdated: [Uint8Array, maxEntities],
});
