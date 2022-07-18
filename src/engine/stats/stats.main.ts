import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, Thread } from "../module/module.common";
import { InitializeStatsBufferMessage, StatNames, Stats, StatsBuffer, StatsMessageType } from "./stats.common";

/*********
 * Types *
 ********/

export interface StatsModuleState {
  buffer: StatsBuffer;
  stats: StatsObject;
}

export type StatsObject = { [Property in Exclude<keyof typeof Stats, number>]: number | string };

/******************
 * Initialization *
 *****************/

export const StatsModule = defineModule<IMainThreadContext, StatsModuleState>({
  name: "stats",
  create(ctx, { sendMessage }) {
    const statsBuffer = createStatsBuffer();

    sendMessage<InitializeStatsBufferMessage>(Thread.Game, StatsMessageType.InitializeStatsBuffer, { statsBuffer });
    sendMessage<InitializeStatsBufferMessage>(Thread.Render, StatsMessageType.InitializeStatsBuffer, { statsBuffer });

    return {
      buffer: statsBuffer,
      stats: Object.fromEntries(StatNames.map((key) => [key, 0])) as StatsObject,
    };
  },
  init(context) {
    const stats = getModule(context, StatsModule);
    context.initialGameWorkerState.statsBuffer = stats.buffer;
    context.initialRenderWorkerState.statsBuffer = stats.buffer;
  },
});

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
  const { stats, buffer } = getModule(context, StatsModule);
  stats.fps = buffer.f32[Stats.fps].toFixed(2);
  stats.frameTime = buffer.f32[Stats.frameTime].toFixed(2);
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
