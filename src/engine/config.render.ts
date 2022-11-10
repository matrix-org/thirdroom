import { ThirdroomModule } from "../plugins/thirdroom/thirdroom.render";
import { UpdateRendererMaterialSystem } from "./material/material.render";
import { defineConfig } from "./module/module.common";
import { RendererModule, RendererSystem } from "./renderer/renderer.render";
import { ResourceModule, ResourceDisposalSystem } from "./resource/resource.render";
import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";

export default defineConfig({
  modules: [ResourceModule, RendererModule, StatsModule, ThirdroomModule],
  systems: [UpdateRendererMaterialSystem, RendererSystem, RenderThreadStatsSystem, ResourceDisposalSystem],
});
