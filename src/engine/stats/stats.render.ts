import { WebGLRenderer } from "three";

import { Stats, StatsBuffer } from "./stats.common";

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
