import { WebGLRenderer } from "three";

import { GameState } from "./GameWorker";

export interface StatsBuffer {
  buffer: SharedArrayBuffer;
  f32: Float32Array;
  u32: Uint32Array;
}

export enum Stats {
  fps,
  frameTime,
  frameDuration,
  gameTime,
  gameDuration,
  frame,
  staleFrames,
  drawCalls,
  programs,
  geometries,
  textures,
  triangles,
  points,
  lines,
}

const StatNames = Object.keys(Stats).filter((v) => isNaN(+v));

export function createStatsBuffer(statsBuffer?: SharedArrayBuffer): StatsBuffer {
  const buffer = statsBuffer || new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * StatNames.length);

  return {
    buffer,
    f32: new Float32Array(buffer),
    u32: new Uint32Array(buffer),
  };
}

export function writeRenderWorkerStats(
  buffer: StatsBuffer,
  frameTime: number,
  frameDuration: number,
  renderer: WebGLRenderer,
  staleFrames: number
) {
  const {
    render: { frame, calls, triangles, points, lines },
    memory: { geometries, textures },
    programs,
  } = renderer.info;

  buffer.f32[Stats.fps] = 1 / frameTime;
  buffer.f32[Stats.frameTime] = frameTime;
  buffer.f32[Stats.frameDuration] = frameDuration;
  buffer.u32[Stats.frame] = frame;
  buffer.u32[Stats.staleFrames] = staleFrames;
  buffer.u32[Stats.drawCalls] = calls;
  buffer.u32[Stats.programs] = programs ? programs.length : 0;
  buffer.u32[Stats.geometries] = geometries;
  buffer.u32[Stats.textures] = textures;
  buffer.u32[Stats.triangles] = triangles;
  buffer.u32[Stats.points] = points;
  buffer.u32[Stats.lines] = lines;
}

export function writeGameWorkerStats(state: GameState, frameDuration: number) {
  state.statsBuffer.f32[Stats.gameTime] = state.time.dt;
  state.statsBuffer.f32[Stats.gameDuration] = frameDuration;
}

export type StatsObject = { [Property in Exclude<keyof typeof Stats, number>]: number | string };

const stats: StatsObject = Object.fromEntries(StatNames.map((key) => [key, 0])) as StatsObject;

export function getStats(buffer: StatsBuffer): StatsObject {
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
