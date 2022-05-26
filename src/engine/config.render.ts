//import { EditorModule } from "./editor/editor.renderer";
import { defineConfig } from "./module/module.common";
import { RaycasterModule, RendererRaycasterSystem } from "./raycaster/raycaster.renderer";
// import { RendererModule, RendererSystem } from "./renderer/renderer.render";
// import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";

export default defineConfig({
  modules: [
    // RendererModule,
    RaycasterModule,
    // EditorModule,
    // StatsModule,
  ],
  systems: [
    RendererRaycasterSystem,
    //RendererSystem,
    //RenderThreadStatsSystem
  ],
});
