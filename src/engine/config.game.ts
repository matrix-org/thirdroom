import { defineConfig } from "./module/module.common";
import { GameAudioModule, GameAudioSystem } from "./audio/audio.game";
import { ApplyInputSystem, InputModule, ResetInputSystem } from "./input/input.game";
import { PhysicsModule, PhysicsSystem } from "./physics/physics.game";
import { InboundNetworkSystem, NetworkModule, OutboundNetworkSystem } from "./network/network.game";
import { ActionMappingSystem } from "./input/ActionMappingSystem";
import { FirstPersonCameraModule, FirstPersonCameraSystem } from "../plugins/FirstPersonCamera";
import { PhysicsCharacterControllerModule, PlayerControllerSystem } from "../plugins/PhysicsCharacterController";
import { GameWorkerStatsSystem, StatsModule } from "./stats/stats.game";
import {
  EditorModule,
  //EditorSelectionSystem,
  EditorStateSystem,
} from "./editor/editor.game";
import { GameState } from "./GameTypes";
import { RenderableSystem, RendererModule } from "./renderer/renderer.game";
import { CubeSpawnerModule, CubeSpawnerSystem } from "../plugins/CubeSpawner";
import { ResourceLoaderSystem, ResourceModule } from "./resource/resource.game";
import { ThirdRoomModule } from "../plugins/thirdroom/thirdroom.game";
import { RemoteNodeSystem } from "./node/node.game";
import { UpdateMatrixWorldSystem } from "./component/transform";
import { RemoteSceneSystem } from "./scene/scene.game";
import { GrabThrowModule, GrabThrowSystem } from "../plugins/GrabThrowController";
import { FlyCharacterControllerModule, FlyControlsSystem } from "../plugins/FlyCharacterController";
import { NetworkTransformSystem } from "./network/NetworkTransformSystem";
import { PrefabDisposalSystem, PrefabModule } from "./prefab/prefab.game";
import { AnimationSystem } from "./animation/animation.game";
import { NameSystem } from "./component/Name";
import { ReticleFocusSystem } from "../plugins/reticle/reticle.game";
import { NametagModule, NametagSystem } from "../plugins/nametags/nametags.game";

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
    CubeSpawnerModule,
    GrabThrowModule,
    NametagModule,
  ],
  systems: [
    ApplyInputSystem,
    ActionMappingSystem,

    InboundNetworkSystem,
    NetworkTransformSystem,

    FirstPersonCameraSystem,
    PlayerControllerSystem,
    FlyControlsSystem,
    PhysicsSystem,
    AnimationSystem,
    CubeSpawnerSystem,
    ReticleFocusSystem,
    GrabThrowSystem,

    UpdateMatrixWorldSystem,

    NametagSystem,
    EditorStateSystem,
    //EditorSelectionSystem,

    OutboundNetworkSystem,

    GameAudioSystem,
    RenderableSystem,
    RemoteNodeSystem,
    RemoteSceneSystem,
    ResourceLoaderSystem,
    PrefabDisposalSystem,
    NameSystem,

    ResetInputSystem,
    GameWorkerStatsSystem,
  ],
});
