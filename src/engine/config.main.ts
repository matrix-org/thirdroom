import { defineConfig } from "./module/module.common";
import {
  AudioModule,
  MainThreadAudioDataResource,
  MainThreadAudioEmitterResource,
  MainThreadAudioSourceResource,
  MainThreadAudioSystem,
  MainThreadSceneResource,
} from "./audio/audio.main";
import { EditorModule, MainThreadEditorSystem } from "./editor/editor.main";
import { InputModule } from "./input/input.main";
import { MainThreadNetworkSystem, NetworkModule } from "./network/network.main";
import { StatsModule } from "./stats/stats.main";
import { IMainThreadContext } from "./MainThread";
import { RendererModule } from "./renderer/renderer.main";
import { ResourceModule, ResourceDisposalSystem } from "./resource/resource.main";
import { ThirdroomModule } from "../plugins/thirdroom/thirdroom.main";
import {
  SamplerResource,
  BufferResource,
  BufferViewResource,
  ImageResource,
  TextureResource,
  ReflectionProbeResource,
  MaterialResource,
  LightResource,
  CameraResource,
  SparseAccessorResource,
  AccessorResource,
  MeshPrimitiveResource,
  InstancedMeshResource,
  MeshResource,
  LightMapResource,
  TilesRendererResource,
  SkinResource,
  InteractableResource,
  NodeResource,
} from "./resource/schema";
import { ILocalResourceClass } from "./resource/LocalResourceClass";
import { ResourceDefinition } from "./resource/ResourceDefinition";
import { MainThreadNametagResource } from "./nametag/nametag.main";

export default defineConfig<IMainThreadContext, ILocalResourceClass<ResourceDefinition<{}>, IMainThreadContext>>({
  modules: [
    ResourceModule,
    EditorModule,
    AudioModule,
    NetworkModule,
    InputModule,
    StatsModule,
    RendererModule,
    ThirdroomModule,
  ],
  systems: [ResourceDisposalSystem, MainThreadAudioSystem, MainThreadNetworkSystem, MainThreadEditorSystem],
  resources: [
    MainThreadNametagResource,
    SamplerResource,
    BufferResource,
    BufferViewResource,
    MainThreadAudioDataResource,
    MainThreadAudioSourceResource,
    MainThreadAudioEmitterResource,
    ImageResource,
    TextureResource,
    ReflectionProbeResource,
    MaterialResource,
    LightResource,
    CameraResource,
    SparseAccessorResource,
    AccessorResource,
    MeshPrimitiveResource,
    InstancedMeshResource,
    MeshResource,
    LightMapResource,
    TilesRendererResource,
    SkinResource,
    InteractableResource,
    NodeResource,
    MainThreadSceneResource,
  ],
});
