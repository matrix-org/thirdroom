import { defineModule, getModule, Thread } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { InitializeStatsBufferMessage, Stats, StatsBuffer, StatsMessageType } from "./stats.common";

interface StatsModuleState {
  statsBuffer: StatsBuffer;
  staleFrameCounter: number;
  staleTripleBufferCounter: number;
}

export const StatsModule = defineModule<RenderThreadState, StatsModuleState>({
  name: "stats",
  async create(ctx, { waitForMessage }) {
    const { statsBuffer } = await waitForMessage<InitializeStatsBufferMessage>(
      Thread.Main,
      StatsMessageType.InitializeStatsBuffer
    );

    return {
      statsBuffer,
      staleFrameCounter: 0,
      staleTripleBufferCounter: 0,
    };
  },
  init() {},
});

export function RenderThreadStatsSystem(state: RenderThreadState) {
  const renderModule = getModule(state, RendererModule);
  const {
    render: { frame, calls, triangles, points, lines },
    memory: { geometries, textures },
    programs,
  } = renderModule.renderer.info;

  const { statsBuffer, staleFrameCounter } = getModule(state, StatsModule);

  const end = performance.now();

  const frameDuration = end - state.elapsed;

  statsBuffer.f32[Stats.fps] = 1 / state.dt;
  statsBuffer.f32[Stats.frameTime] = state.dt * 1000;
  statsBuffer.f32[Stats.frameDuration] = frameDuration;
  statsBuffer.u32[Stats.frame] = frame;
  statsBuffer.u32[Stats.staleFrames] = staleFrameCounter;
  statsBuffer.u32[Stats.drawCalls] = calls;
  statsBuffer.u32[Stats.programs] = programs ? programs.length : 0;
  statsBuffer.u32[Stats.geometries] = geometries;
  statsBuffer.u32[Stats.textures] = textures;
  statsBuffer.u32[Stats.triangles] = triangles;
  statsBuffer.u32[Stats.points] = points;
  statsBuffer.u32[Stats.lines] = lines;
}
