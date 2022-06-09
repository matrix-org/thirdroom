import { defineObjectBufferSchema } from "../allocator/ObjectBufferView";
import { maxEntities } from "../config.common";

export const renderableSchema = defineObjectBufferSchema({
  resourceId: [Uint32Array, maxEntities],
  interpolate: [Uint8Array, maxEntities],
  visible: [Uint8Array, maxEntities],
});
