import { MainContext } from "../MainThread";
import { defineModule, getModule, Thread } from "../module/module.common";
import { RenderStats } from "../renderer/renderer.common";
import { RendererModule } from "../renderer/renderer.main";
import { InitializeStatsBufferMessage, StatNames, Stats, StatsBuffer, StatsMessageType } from "./stats.common";

/*********
 * Types *
 ********/

export interface StatsModuleState {
  buffer: StatsBuffer;
  stats: StatsObject;
}

export type StatsObject = { [Property in Exclude<keyof (typeof Stats & typeof RenderStats), number>]: number | string };

/******************
 * Initialization *
 *****************/

export const StatsModule = defineModule<MainContext, StatsModuleState>({
  name: "stats",
  create(ctx, { sendMessage }) {
    const statsBuffer = createStatsBuffer();

    sendMessage<InitializeStatsBufferMessage>(Thread.Game, StatsMessageType.InitializeStatsBuffer, { statsBuffer });

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

export function getStats(ctx: MainContext): StatsObject {
  const { stats, buffer } = getModule(ctx, StatsModule);
  const { statsBuffer: renderStatsBuffer } = getModule(ctx, RendererModule);
  stats.fps = renderStatsBuffer.f32[RenderStats.fps].toFixed(2);
  stats.frameTime = renderStatsBuffer.f32[RenderStats.frameTime].toFixed(2);
  stats.frameDuration = (renderStatsBuffer.f32[RenderStats.frameDuration] * 1000).toFixed(2);
  stats.gameTime = (buffer.f32[Stats.gameTime] * 1000).toFixed(2);
  stats.gameDuration = buffer.f32[Stats.gameDuration].toFixed(2);
  stats.frame = renderStatsBuffer.u32[RenderStats.frame];
  stats.staleFrames = renderStatsBuffer.u32[RenderStats.staleFrames];
  stats.drawCalls = renderStatsBuffer.u32[RenderStats.drawCalls];
  stats.programs = renderStatsBuffer.u32[RenderStats.programs];
  stats.geometries = renderStatsBuffer.u32[RenderStats.geometries];
  stats.textures = renderStatsBuffer.u32[RenderStats.textures];
  stats.triangles = renderStatsBuffer.u32[RenderStats.triangles];
  stats.points = renderStatsBuffer.u32[RenderStats.points];
  stats.lines = renderStatsBuffer.u32[RenderStats.lines];
  return stats;
}
