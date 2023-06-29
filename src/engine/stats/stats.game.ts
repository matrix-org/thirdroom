import { GameContext } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import { InitializeStatsBufferMessage, Stats, StatsBuffer, StatsMessageType } from "./stats.common";

interface StatsModuleState {
  statsBuffer: StatsBuffer;
}

export const StatsModule = defineModule<GameContext, StatsModuleState>({
  name: "stats",
  async create(ctx, { waitForMessage }) {
    const { statsBuffer } = await waitForMessage<InitializeStatsBufferMessage>(
      Thread.Main,
      StatsMessageType.InitializeStatsBuffer
    );

    return {
      statsBuffer,
    };
  },
  init() {},
});

export function GameWorkerStatsSystem(ctx: GameContext) {
  const stats = getModule(ctx, StatsModule);
  const frameDuration = performance.now() - ctx.elapsed;
  stats.statsBuffer.f32[Stats.gameTime] = ctx.dt;
  stats.statsBuffer.f32[Stats.gameDuration] = frameDuration;
}
