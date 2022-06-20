import { defineConfig } from "./module/module.common";
import { RendererModule, RendererSystem } from "./renderer/renderer.render";
import { ResourceModule } from "./resource/resource.render";
import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";

export default defineConfig({
  modules: [ResourceModule, RendererModule, StatsModule],
  systems: [RendererSystem, RenderThreadStatsSystem],
});
