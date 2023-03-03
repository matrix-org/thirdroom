import { ThirdroomModule } from "../plugins/thirdroom/thirdroom.render";
import { EditorModule } from "./editor/editor.render";
import { InputModule, UpdateXRInputSourcesSystem } from "./input/input.render";
import { UpdateRendererMaterialSystem } from "./material/UpdateRendererMaterialSystem";
import { UpdateRendererMeshPrimitivesSystem } from "./mesh/mesh.render";
import { defineConfig } from "./module/module.common";
import { PhysicsDebugRenderSystem, PhysicsModule } from "./physics/physics.render";
import { RendererModule, RendererSystem } from "./renderer/renderer.render";
import { RendererIncomingTripleBufferSystem } from "./renderer/RendererIncomingTripleBufferSystem";
import { RendererOutgoingTripleBufferSystem } from "./renderer/RendererOutgoingTripleBufferSystem";
import { ResourceModule, ResourceLoaderSystem, ReturnRecycledResourcesSystem } from "./resource/resource.render";
import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";
import { WebSGUIModule } from "./ui/ui.render";

export default defineConfig({
  modules: [ResourceModule, RendererModule, PhysicsModule, InputModule, StatsModule, ThirdroomModule, EditorModule, WebSGUIModule],
  systems: [
    RendererIncomingTripleBufferSystem,
    UpdateXRInputSourcesSystem,
    ResourceLoaderSystem, // Drain dispose queue and create messages. Add eid to recycle queue if disposed.
    UpdateRendererMaterialSystem,
    UpdateRendererMeshPrimitivesSystem,
    PhysicsDebugRenderSystem,
    RendererSystem,
    RenderThreadStatsSystem,
    RendererOutgoingTripleBufferSystem, // Swap outgoing triplebuffers
    ReturnRecycledResourcesSystem, // Actually enqueue into recycle ringbuffer
  ],
});
