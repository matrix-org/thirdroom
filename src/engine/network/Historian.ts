import { createInterpolationBuffer, InterpolationBuffer } from "./InterpolationBuffer";

// should be greater than tickRate in millis
export const INTERP_AMOUNT_MS = 100;
export const INTERP_BUFFER_MS = INTERP_AMOUNT_MS * 5;

export interface Historian {
  entities: Map<number, InterpolationBuffer>;
  // latest tick received from the peer
  latestTick: number;
  // latest timestamp value continuously set by packets received from the peer
  latestTime: number;
  // incremented each frame with our local delta time
  localTime: number;
  // target elapsed to lerp towards
  targetTime: number;
  fractionOfTimePassed: number;
  // holds a history of elapsed timestamps
  timestamps: number[];
  // flag for indicating that a new packet has arrived and the historian needs updated
  needsUpdate: boolean;
  index?: number;
  // latency to the associated data source
  latency: number;
}

export const createHistorian = (): Historian => ({
  entities: new Map(),
  latestTick: 0,
  latestTime: 0,
  localTime: 0,
  targetTime: 0,
  fractionOfTimePassed: 0,
  timestamps: [],
  needsUpdate: false,
  latency: 0,
});

export const addEntityToHistorian = (h: Historian, eid: number) => h.entities.set(eid, createInterpolationBuffer());

export const removeEntityFromHistorian = (h: Historian, eid: number) => h.entities.delete(eid);

export const getEntityHistory = (h: Historian, eid: number): InterpolationBuffer => {
  const interpBuffer = h.entities.get(eid);
  if (!interpBuffer) throw new Error("entity not found in historian: " + eid);
  return interpBuffer;
};
