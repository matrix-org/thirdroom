import { defineConfig } from "./module/module.common";
import { GameAudioModule, GameAudioSystem } from "./audio/audio.game";
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
import { RemoteNodeSystem } from "./node/node.game";
import { UpdateMatrixWorldSystem } from "./component/transform";
import { RemoteSceneSystem } from "./scene/scene.game";
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

export default defineConfig<GameState>({
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

    // Copy Transform to RemoteNode
    ScriptingSystem,
    // Copy RemoteNode to Transform

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

    ResetInputSystem,
    GameWorkerStatsSystem,
  ],
});
