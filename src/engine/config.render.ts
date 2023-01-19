import { ThirdroomModule } from "../plugins/thirdroom/thirdroom.render";
import { UpdateRendererMaterialSystem } from "./material/UpdateRendererMaterialSystem";
import { UpdateRendererMeshPrimitivesSystem } from "./mesh/mesh.render";
import { defineConfig } from "./module/module.common";
import { RendererModule, RendererSystem } from "./renderer/renderer.render";
import { RendererIncomingTripleBufferSystem } from "./renderer/RendererIncomingTripleBufferSystem";
import { RendererOutgoingTripleBufferSystem } from "./renderer/RendererOutgoingTripleBufferSystem";
import { ResourceModule, ResourceLoaderSystem, ReturnRecycledResourcesSystem } from "./resource/resource.render";
import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";

export default defineConfig({
  modules: [ResourceModule, RendererModule, StatsModule, ThirdroomModule],
  systems: [
    RendererIncomingTripleBufferSystem,
    ResourceLoaderSystem, // Drain dispose queue and create messages. Add eid to recycle queue if disposed.
    UpdateRendererMaterialSystem,
    UpdateRendererMeshPrimitivesSystem,
    RendererSystem,
    RenderThreadStatsSystem,
    RendererOutgoingTripleBufferSystem, // Swap outgoing triplebuffers
    ReturnRecycledResourcesSystem, // Actually enqueue into recycle ringbuffer
  ],
});
