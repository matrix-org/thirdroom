import { ThirdroomModule } from "../plugins/thirdroom/thirdroom.render";
import { UpdateRendererMaterialSystem } from "./material/UpdateRendererMaterialSystem";
import { UpdateRendererMeshPrimitivesSystem } from "./mesh/mesh.render";
import { defineConfig } from "./module/module.common";
import { RendererModule, RendererSystem } from "./renderer/renderer.render";
import { ResourceModule, ResourceLoaderSystem } from "./resource/resource.render";
import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";

export default defineConfig({
  modules: [ResourceModule, RendererModule, StatsModule, ThirdroomModule],
  systems: [
    ResourceLoaderSystem,
    UpdateRendererMaterialSystem,
    UpdateRendererMeshPrimitivesSystem,
    RendererSystem,
    RenderThreadStatsSystem,
  ],
});
