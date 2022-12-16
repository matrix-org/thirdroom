import { ThirdroomModule } from "../plugins/thirdroom/thirdroom.render";
import { RendererAccessorResource } from "./accessor/accessor.render";
import { RendererImageResource } from "./image/image.render";
import { RendererMaterialResource, UpdateRendererMaterialSystem } from "./material/material.render";
import {
  RendererInstancedMeshResource,
  RendererLightMapResource,
  RendererMeshPrimitiveResource,
  RendererMeshResource,
  RendererSkinResource,
  UpdateRendererMeshPrimitivesSystem,
} from "./mesh/mesh.render";
import { defineConfig } from "./module/module.common";
import { RendererReflectionProbeResource } from "./reflection-probe/reflection-probe.render";
import { RendererModule, RendererSystem, RenderThreadState } from "./renderer/renderer.render";
import { ILocalResourceClass } from "./resource/LocalResourceClass";
import { ResourceModule, ResourceDisposalSystem } from "./resource/resource.render";
import { ResourceDefinition } from "./resource/ResourceDefinition";
import {
  NametagResource,
  SamplerResource,
  BufferResource,
  BufferViewResource,
  AudioDataResource,
  AudioSourceResource,
  AudioEmitterResource,
  LightResource,
  CameraResource,
  SparseAccessorResource,
  InteractableResource,
  NodeResource,
  SceneResource,
} from "./resource/schema";
import { StatsModule, RenderThreadStatsSystem } from "./stats/stats.render";
import { RendererTextureResource } from "./texture/texture.render";
import { RendererTilesRendererResource } from "./tiles-renderer/tiles-renderer.render";

export default defineConfig<RenderThreadState, ILocalResourceClass<ResourceDefinition<{}>>>({
  modules: [ResourceModule, RendererModule, StatsModule, ThirdroomModule],
  systems: [
    ResourceDisposalSystem,
    UpdateRendererMaterialSystem,
    UpdateRendererMeshPrimitivesSystem,
    RendererSystem,
    RenderThreadStatsSystem,
  ],
  resources: [
    NametagResource,
    SamplerResource,
    BufferResource,
    BufferViewResource,
    AudioDataResource,
    AudioSourceResource,
    AudioEmitterResource,
    RendererImageResource,
    RendererTextureResource,
    RendererReflectionProbeResource,
    RendererMaterialResource,
    LightResource,
    CameraResource,
    SparseAccessorResource,
    RendererAccessorResource,
    RendererMeshPrimitiveResource,
    RendererInstancedMeshResource,
    RendererMeshResource,
    RendererLightMapResource,
    RendererTilesRendererResource,
    RendererSkinResource,
    InteractableResource,
    NodeResource,
    SceneResource,
  ],
});
