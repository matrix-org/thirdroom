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

export default defineConfig<GameState>({
  modules: [
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
    CubeSpawnerModule,
    GrabThrowModule,
  ],
  systems: [
    ApplyInputSystem,
    ActionMappingSystem,

    InboundNetworkSystem,

    FirstPersonCameraSystem,
    PlayerControllerSystem,
    PhysicsSystem,
    CubeSpawnerSystem,
    GrabThrowSystem,

    UpdateMatrixWorldSystem,

    EditorStateSystem,
    //EditorSelectionSystem,

    OutboundNetworkSystem,

    GameAudioSystem,
    RenderableSystem,
    RemoteNodeSystem,
    RemoteSceneSystem,
    ResourceLoaderSystem,

    ResetInputSystem,
    GameWorkerStatsSystem,
  ],
});
