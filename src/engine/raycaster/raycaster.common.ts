import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";

export const raycasterStateSchema = defineObjectBufferSchema({
  intersectionNodeId: [Uint32Array, 1],
});

export type RaycasterStateTripleBuffer = ObjectTripleBuffer<typeof raycasterStateSchema>;

export enum RaycasterMessageType {
  InitRaycaster = "init-raycaster",
}

export interface InitRaycasterMessage {
  sharedRaycasterState: RaycasterStateTripleBuffer;
}
