import { defineConfig } from "./module/module.common";
import { GameAudioSystem, ResetAudioSourcesSystem } from "./audio/audio.game";
import { ApplyInputSystem, InputModule, ResetInputSystem } from "./input/input.game";
import { PhysicsModule, StepPhysicsSystem, SyncPhysicsSystem } from "./physics/physics.game";
import { NetworkModule } from "./network/network.game";
import { ActionMappingSystem } from "./input/ActionMappingSystem";
import {
  FirstPersonCameraModule,
  FirstPersonCameraSystem,
  NetworkedFirstPersonCameraSystem,
} from "../plugins/FirstPersonCamera";
import {
  KinematicCharacterControllerModule,
  KinematicCharacterControllerSystem,
} from "../plugins/KinematicCharacterController";
import { GameWorkerStatsSystem, StatsModule } from "./stats/stats.game";
import {
  EditorModule,
  //EditorSelectionSystem,
  EditorStateSystem,
} from "./editor/editor.game";
import { GameState } from "./GameTypes";
import { RendererModule } from "./renderer/renderer.game";
import { SpawnablesModule, SpawnableSystem } from "../plugins/spawnables/spawnables.game";
import { ResourceLoaderSystem, ResourceModule } from "./resource/resource.game";
import { ThirdRoomModule, ThirdroomSystem } from "../plugins/thirdroom/thirdroom.game";
import { RemoteNodeSystem } from "./node/node.game";
import { UpdateMatrixWorldSystem } from "./component/transform";
import { RemoteSceneSystem } from "./scene/scene.game";
import { FlyCharacterControllerModule, FlyControllerSystem } from "../plugins/FlyCharacterController";
import { NetworkInterpolationSystem } from "./network/NetworkInterpolationSystem";
import { PrefabDisposalSystem, PrefabModule } from "./prefab/prefab.game";
import { AnimationSystem } from "./animation/animation.game";
import { InteractionModule, InteractionSystem } from "../plugins/interaction/interaction.game";
import { NametagModule, NametagSystem } from "../plugins/nametags/nametags.game";
import { ScriptingSystem } from "./scripting/scripting.game";
import { GameResourceSystem } from "./resource/GameResourceSystem";
import { RemoteCameraSystem } from "./camera/camera.game";
import { InboundNetworkSystem } from "./network/inbound.game";
import { OutboundNetworkSystem } from "./network/outbound.game";

export default defineConfig<GameState>({
  modules: [
    PrefabModule,
    ResourceModule,
    InputModule,
    PhysicsModule,
    NetworkModule,
    StatsModule,
    EditorModule,
    RendererModule,
    ThirdRoomModule,
    FirstPersonCameraModule,
    KinematicCharacterControllerModule,
    FlyCharacterControllerModule,
    InteractionModule,
    SpawnablesModule,
    NametagModule,
  ],
  systems: [
    ApplyInputSystem,
    ActionMappingSystem,

    InboundNetworkSystem,

    FirstPersonCameraSystem,
    KinematicCharacterControllerSystem,
    FlyControllerSystem,
    InteractionSystem,
    SpawnableSystem,
    ThirdroomSystem,

    // step physics forward
    StepPhysicsSystem,

    // copy rigidbody data to transform component
    SyncPhysicsSystem,

    // interpolate towards authoritative state
    NetworkInterpolationSystem,

    // Copy Transform to RemoteNode
    ScriptingSystem,
    // Copy RemoteNode to Transform

    AnimationSystem,

    UpdateMatrixWorldSystem,

    NametagSystem,
    EditorStateSystem,
    //EditorSelectionSystem,

    NetworkedFirstPersonCameraSystem,
    OutboundNetworkSystem,

    GameAudioSystem,
    RemoteCameraSystem,
    RemoteNodeSystem,
    RemoteSceneSystem,
    GameResourceSystem,
    ResourceLoaderSystem,
    PrefabDisposalSystem,

    ResetInputSystem,
    ResetAudioSourcesSystem,
    GameWorkerStatsSystem,
  ],
});
