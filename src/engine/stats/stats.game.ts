import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import { InitializeStatsBufferMessage, Stats, StatsBuffer, StatsMessageType } from "./stats.common";

interface StatsModuleState {
  statsBuffer: StatsBuffer;
}

export const StatsModule = defineModule<GameState, StatsModuleState>({
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

export function GameWorkerStatsSystem(state: GameState) {
  const stats = getModule(state, StatsModule);
  const frameDuration = performance.now() - state.elapsed;
  stats.statsBuffer.f32[Stats.gameTime] = state.dt;
  stats.statsBuffer.f32[Stats.gameDuration] = frameDuration;
}
