import { IMainThreadContext } from "../MainThread";
import { getScope } from "../module/module.common";
import { StatNames, Stats, StatsBuffer } from "./stats.common";

/*********
 * Types *
 ********/

export interface StatsScope {
  buffer: StatsBuffer;
  stats: StatsObject;
}

export type StatsObject = { [Property in Exclude<keyof typeof Stats, number>]: number | string };

/******************
 * Initialization *
 *****************/

export function StatsScope(): StatsScope {
  return {
    buffer: createStatsBuffer(),
    stats: Object.fromEntries(StatNames.map((key) => [key, 0])) as StatsObject,
  };
}

export function StatsModule(context: IMainThreadContext) {
  const stats = getScope(context, StatsScope);
  context.initialGameWorkerState.statsBuffer = stats.buffer;
  context.initialRenderWorkerState.statsBuffer = stats.buffer;
}

function createStatsBuffer(): StatsBuffer {
  const buffer = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * StatNames.length);

  return {
    buffer,
    f32: new Float32Array(buffer),
    u32: new Uint32Array(buffer),
  };
}

/*******
 * API *
 ******/

export function getStats(context: IMainThreadContext): StatsObject {
  const { stats, buffer } = getScope(context, StatsScope);
  stats.fps = buffer.f32[Stats.fps].toFixed(2);
  stats.frameTime = (buffer.f32[Stats.frameTime] * 1000).toFixed(2);
  stats.frameDuration = (buffer.f32[Stats.frameDuration] * 1000).toFixed(2);
  stats.gameTime = (buffer.f32[Stats.gameTime] * 1000).toFixed(2);
  stats.gameDuration = buffer.f32[Stats.gameDuration].toFixed(2);
  stats.frame = buffer.u32[Stats.frame];
  stats.staleFrames = buffer.u32[Stats.staleFrames];
  stats.drawCalls = buffer.u32[Stats.drawCalls];
  stats.programs = buffer.u32[Stats.programs];
  stats.geometries = buffer.u32[Stats.geometries];
  stats.textures = buffer.u32[Stats.textures];
  stats.triangles = buffer.u32[Stats.triangles];
  stats.points = buffer.u32[Stats.points];
  stats.lines = buffer.u32[Stats.lines];
  return stats;
}
