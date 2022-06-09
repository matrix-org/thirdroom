import { defineConfig } from "./module/module.common";
import { GameAudioModule, AudioSystem } from "./audio/audio.game";
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
import { ResourceModule } from "./resource/resource.game";
import { ThirdRoomModule } from "../plugins/thirdroom/thirdroom.game";

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
    FirstPersonCameraModule,
    PhysicsCharacterControllerModule,
    CubeSpawnerModule,
    ThirdRoomModule,
  ],
  systems: [
    ApplyInputSystem,
    ActionMappingSystem,
    AudioSystem,

    InboundNetworkSystem,

    FirstPersonCameraSystem,
    PlayerControllerSystem,
    PhysicsSystem,
    CubeSpawnerSystem,

    EditorStateSystem,
    //EditorSelectionSystem,

    OutboundNetworkSystem,

    GameWorkerStatsSystem,

    RenderableSystem,
    ResetInputSystem,
  ],
});
