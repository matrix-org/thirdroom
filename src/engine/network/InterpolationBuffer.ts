import { Historian } from "./Historian";

// TODO: make generic & optimize

export interface InterpolationBuffer {
  position: Float32Array[];
  velocity: Float32Array[];
  quaternion: Float32Array[];
}

export const createInterpolationBuffer = (): InterpolationBuffer => ({
  position: [],
  velocity: [],
  quaternion: [],
});

export const syncWithHistorian = (history: InterpolationBuffer, historian: Historian) => {
  const i = historian.timestamps.length;
  history.position.splice(i);
  history.velocity.splice(i);
  history.quaternion.splice(i);
};

export const addEntityHistory = (
  history: InterpolationBuffer,
  position: Float32Array,
  velocity: Float32Array,
  quaternion: Float32Array
) => {
  history.position.unshift(new Float32Array(position));
  history.velocity.unshift(new Float32Array(velocity));
  history.quaternion.unshift(new Float32Array(quaternion));
  return history;
};
