import { createInterpolationBuffer, InterpolationBuffer } from "./InterpolationBuffer";

// larger interp buffer, larger latency, smoother gameplay at higher latencies
export const INTERP_BUFFER_MS = 200;

export interface Historian {
  entities: Map<number, InterpolationBuffer>;
  interpolationBufferMs: number;
  // latest elapsed value continuously set by packets recieved from the peer
  latestElapsed: number;
  // incremented each frame with our local delta time
  localElapsed: number;
  // target elapsed to lerp towards
  targetElapsed: number;
  fractionOfTimePassed: number;
  // holds a history of elapsed timestamps
  timestamps: number[];
  // flag for indicating that a new packet has arrived and the historian needs updated
  needsUpdate: boolean;
  index?: number;
}

export const createHistorian = (interpolationBufferMs = INTERP_BUFFER_MS): Historian => ({
  entities: new Map(),
  interpolationBufferMs,
  latestElapsed: 0,
  localElapsed: 0,
  targetElapsed: 0,
  fractionOfTimePassed: 0,
  timestamps: [],
  needsUpdate: false,
});

export const addEntityToHistorian = (h: Historian, eid: number) => h.entities.set(eid, createInterpolationBuffer());

export const removeEntityFromHistorian = (h: Historian, eid: number) => h.entities.delete(eid);

export const getEntityHistory = (h: Historian, eid: number): InterpolationBuffer => {
  const interpBuffer = h.entities.get(eid);
  if (!interpBuffer) throw new Error("entity not found in historian: " + eid);
  return interpBuffer;
};
