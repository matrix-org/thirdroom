import { GameState, IInitialGameThreadState } from "../GameWorker";
import { defineModule, getModule } from "../module/module.common";
import { Stats, StatsBuffer } from "./stats.common";

interface StatsModuleState {
  statsBuffer: StatsBuffer;
}

export const StatsModule = defineModule<GameState, IInitialGameThreadState, StatsModuleState>({
  create({ statsBuffer }) {
    return {
      statsBuffer,
    };
  },
  init() {},
});

export function GameWorkerStatsSystem(state: GameState) {
  const stats = getModule(state, StatsModule);
  const frameDuration = performance.now() - state.time.elapsed;
  stats.statsBuffer.f32[Stats.gameTime] = state.time.dt;
  stats.statsBuffer.f32[Stats.gameDuration] = frameDuration;
}
