import { ThirdroomModule } from "../plugins/thirdroom/thirdroom.render";
import { EditorModule } from "./editor/editor.render";
import { InputModule, UpdateXRInputSourcesSystem } from "./input/input.render";
import { UpdateRendererMaterialSystem } from "./material/UpdateRendererMaterialSystem";
import { UpdateRendererMeshPrimitivesSystem } from "./mesh/mesh.render";
import { defineConfig } from "./module/module.common";
import { RendererModule, RendererSystem } from "./renderer/renderer.render";
import { RendererIncomingTripleBufferSystem } from "./renderer/RendererIncomingTripleBufferSystem";
import { RendererOutgoingTripleBufferSystem } from "./renderer/RendererOutgoingTripleBufferSystem";
import { ResourceModule, ResourceLoaderSystem, ReturnRecycledResourcesSystem } from "./resource/resource.render";
import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";

export default defineConfig({
  modules: [ResourceModule, RendererModule, InputModule, StatsModule, ThirdroomModule, EditorModule],
  systems: [
    RendererIncomingTripleBufferSystem,
    UpdateXRInputSourcesSystem,
    ResourceLoaderSystem, // Drain dispose queue and create messages. Add eid to recycle queue if disposed.
    UpdateRendererMaterialSystem,
    UpdateRendererMeshPrimitivesSystem,
    RendererSystem,
    RenderThreadStatsSystem,
    RendererOutgoingTripleBufferSystem, // Swap outgoing triplebuffers
    ReturnRecycledResourcesSystem, // Actually enqueue into recycle ringbuffer
  ],
});
