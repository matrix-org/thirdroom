import { defineConfig } from "./module/module.common";
import { GameAudioModule, GameAudioSystem, ResetAudioSourcesSystem } from "./audio/audio.game";
import { ApplyInputSystem, InputModule, ResetInputSystem } from "./input/input.game";
import { PhysicsModule, PhysicsSystem } from "./physics/physics.game";
import { NetworkModule } from "./network/network.game";
import { ActionMappingSystem } from "./input/ActionMappingSystem";
import { FirstPersonCameraModule, FirstPersonCameraSystem } from "../plugins/FirstPersonCamera";
import {
  PhysicsCharacterControllerModule,
  PhysicsCharacterControllerSystem,
} from "../plugins/PhysicsCharacterController";
import { GameWorkerStatsSystem, StatsModule } from "./stats/stats.game";
import {
  EditorModule,
  //EditorSelectionSystem,
  EditorStateSystem,
} from "./editor/editor.game";
import { GameState } from "./GameTypes";
import { RenderableSystem, RendererModule } from "./renderer/renderer.game";
import { SpawnablesModule, SpawnableSystem } from "../plugins/spawnables/spawnables.game";
import { ResourceLoaderSystem, ResourceModule } from "./resource/resource.game";
import { ThirdRoomModule, ThirdroomSystem } from "../plugins/thirdroom/thirdroom.game";
import {
  GameNodeResource,
  RemoteNodeSystem,
  RemoteNodeToTransformSystem,
  TransformToRemoteNodeSystem,
} from "./node/node.game";
import { UpdateMatrixWorldSystem } from "./component/transform";
import { GameSceneResource, RemoteSceneSystem } from "./scene/scene.game";
import { FlyCharacterControllerModule, FlyControllerSystem } from "../plugins/FlyCharacterController";
import { NetworkInterpolationSystem } from "./network/NetworkInterpolationSystem";
import { PrefabDisposalSystem, PrefabModule } from "./prefab/prefab.game";
import { AnimationSystem } from "./animation/animation.game";
import { NameSystem } from "./component/Name";
import { InteractionModule, InteractionSystem } from "../plugins/interaction/interaction.game";
import { NametagModule, NametagSystem } from "../plugins/nametags/nametags.game";
import { ScriptingSystem } from "./scripting/scripting.game";
import { GameResourceSystem } from "./resource/GameResourceSystem";
import { RemoteCameraSystem } from "./camera/camera.game";
import { InboundNetworkSystem } from "./network/inbound.game";
import { OutboundNetworkSystem } from "./network/outbound.game";
import {
  NametagResource,
  SamplerResource,
  BufferResource,
  BufferViewResource,
  AudioDataResource,
  AudioSourceResource,
  AudioEmitterResource,
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
} from "./resource/schema";
import { IRemoteResourceClass } from "./resource/RemoteResourceClass";
import { ResourceDefinition } from "./resource/ResourceDefinition";

export default defineConfig<GameState, IRemoteResourceClass<ResourceDefinition<{}>>>({
  modules: [
    PrefabModule,
    ResourceModule,
    GameAudioModule,
    InputModule,
    PhysicsModule,
    NetworkModule,
    StatsModule,
    EditorModule,
    RendererModule,
    ThirdRoomModule,
    FirstPersonCameraModule,
    PhysicsCharacterControllerModule,
    FlyCharacterControllerModule,
    InteractionModule,
    SpawnablesModule,
    NametagModule,
  ],
  systems: [
    ApplyInputSystem,

    InboundNetworkSystem,

    ActionMappingSystem,

    NetworkInterpolationSystem,

    FirstPersonCameraSystem,
    PhysicsCharacterControllerSystem,
    FlyControllerSystem,
    PhysicsSystem,
    AnimationSystem,
    InteractionSystem,
    SpawnableSystem,
    ThirdroomSystem,

    TransformToRemoteNodeSystem,
    ScriptingSystem,
    RemoteNodeToTransformSystem,

    UpdateMatrixWorldSystem,

    NametagSystem,
    EditorStateSystem,
    //EditorSelectionSystem,

    OutboundNetworkSystem,

    GameAudioSystem,
    RenderableSystem,
    RemoteCameraSystem,
    RemoteNodeSystem,
    RemoteSceneSystem,
    GameResourceSystem,
    ResourceLoaderSystem,
    PrefabDisposalSystem,
    NameSystem,

    TransformToRemoteNodeSystem,
    ResetInputSystem,
    ResetAudioSourcesSystem,
    GameWorkerStatsSystem,
  ],
  resources: [
    NametagResource,
    SamplerResource,
    BufferResource,
    BufferViewResource,
    AudioDataResource,
    AudioSourceResource,
    AudioEmitterResource,
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
    GameNodeResource,
    GameSceneResource,
  ],
});
