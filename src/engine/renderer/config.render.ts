import { defineConfig } from "../module/module.common";
import { RendererModule } from "./renderer.render";
import { ResourceModule, ResourceLoaderSystem, ReturnRecycledResourcesSystem } from "./RenderResources";
import { UpdateRendererMaterialSystem } from "./systems/UpdateRendererMaterialSystem";
import { UpdateRendererMeshPrimitivesSystem } from "./systems/UpdateRendererMeshPrimitivesSystem";
import { PhysicsDebugRenderSystem } from "./systems/PhysicsDebugRenderSystem";
import { RenderSubmitSystem } from "./systems/RenderSubmitSystem";
import { RendererIncomingTripleBufferSystem } from "./systems/RendererIncomingTripleBufferSystem";
import { RendererOutgoingTripleBufferSystem } from "./systems/RendererOutgoingTripleBufferSystem";
import { ResizeViewportSystem } from "./systems/ResizeViewportSystem";
import { LoadImageResourcesSystem } from "./systems/LoadImageResourcesSystem";
import { LoadTextureResourcesSystem } from "./systems/LoadTextureResourcesSystem";
import { UpdateDynamicAccessorsSystem } from "./systems/UpdateDynamicAccessorsSystem";
import { UpdateWorldVisibilitySystem } from "./systems/UpdateWorldVisibilitySystem";
import { UpdateActiveSceneResourceSystem } from "./systems/UpdateActiveSceneResourceSystem";
import { UpdateNodeResourcesSystem } from "./systems/UpdateNodeResourcesSystem";
import { UpdateTileRenderersSystem } from "./systems/UpdateTileRenderersSystem";
import { UpdateReflectionProbesSystem } from "./systems/UpdateReflectionProbesSystem";
import { UpdateNodeReflectionsSystem } from "./systems/UpdateNodeReflectionsSystem";
import { UpdateNodesFromXRPosesSystem } from "./systems/UpdateNodesFromXRPosesSystem";
import { RenderThreadStatsSystem } from "./systems/RenderThreadStatsSystem";
import { UpdateXRInputSourcesSystem } from "./systems/UpdateXRInputSourcesSystem";

export default defineConfig({
  modules: [ResourceModule, RendererModule],
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
    UpdateReflectionProbesSystem,
    UpdateNodeReflectionsSystem,
    UpdateNodesFromXRPosesSystem,
    RenderSubmitSystem,
    RenderThreadStatsSystem,
    RendererOutgoingTripleBufferSystem, // Swap outgoing triplebuffers
    ReturnRecycledResourcesSystem, // Actually enqueue into recycle ringbuffer
  ],
});
