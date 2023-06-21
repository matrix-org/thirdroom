import { ThirdroomModule } from "../plugins/thirdroom/thirdroom.render";
import { EditorModule } from "./editor/editor.render";
import { InputModule, UpdateXRInputSourcesSystem } from "./input/input.render";
import { UpdateRendererMaterialSystem } from "./renderer/systems/UpdateRendererMaterialSystem";
import { UpdateRendererMeshPrimitivesSystem } from "./renderer/systems/UpdateRendererMeshPrimitivesSystem";
import { defineConfig } from "./module/module.common";
import { PhysicsModule } from "./physics/physics.render";
import { PhysicsDebugRenderSystem } from "./renderer/systems/PhysicsDebugRenderSystem";
import { RendererModule } from "./renderer/renderer.render";
import { RenderSubmitSystem } from "./renderer/systems/RenderSubmitSystem";
import { RendererIncomingTripleBufferSystem } from "./renderer/systems/RendererIncomingTripleBufferSystem";
import { RendererOutgoingTripleBufferSystem } from "./renderer/systems/RendererOutgoingTripleBufferSystem";
import { ResourceModule, ResourceLoaderSystem, ReturnRecycledResourcesSystem } from "./resource/resource.render";
import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";
import { WebSGUIModule } from "./ui/ui.render";
import { ResizeViewportSystem } from "./renderer/systems/ResizeViewportSystem";
import { LoadImageResourcesSystem } from "./renderer/systems/LoadImageResourcesSystem";
import { LoadTextureResourcesSystem } from "./renderer/systems/LoadTextureResourcesSystem";
import { UpdateDynamicAccessorsSystem } from "./renderer/systems/UpdateDynamicAccessorsSystem";
import { UpdateWorldVisibilitySystem } from "./renderer/systems/UpdateWorldVisibilitySystem";
import { UpdateActiveSceneResourceSystem } from "./renderer/systems/UpdateActiveSceneResourceSystem";
import { UpdateNodeResourcesSystem } from "./renderer/systems/UpdateNodeResourcesSystem";
import { UpdateTileRenderersSystem } from "./renderer/tiles-renderer";

export default defineConfig({
  modules: [
    ResourceModule,
    RendererModule,
    PhysicsModule,
    InputModule,
    StatsModule,
    ThirdroomModule,
    EditorModule,
    WebSGUIModule,
  ],
  systems: [
    RendererIncomingTripleBufferSystem,
    UpdateXRInputSourcesSystem,
    ResourceLoaderSystem, // Drain dispose queue and create messages. Add eid to recycle queue if disposed.
    UpdateRendererMaterialSystem,
    UpdateRendererMeshPrimitivesSystem,
    PhysicsDebugRenderSystem,
    ResizeViewportSystem,
    LoadImageResourcesSystem,
    LoadTextureResourcesSystem,
    UpdateDynamicAccessorsSystem,
    UpdateWorldVisibilitySystem,
    UpdateActiveSceneResourceSystem,
    UpdateNodeResourcesSystem,
    UpdateTileRenderersSystem,
    RenderSubmitSystem,
    RenderThreadStatsSystem,
    RendererOutgoingTripleBufferSystem, // Swap outgoing triplebuffers
    ReturnRecycledResourcesSystem, // Actually enqueue into recycle ringbuffer
  ],
});
