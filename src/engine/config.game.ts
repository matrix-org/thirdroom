import { defineConfig } from "./module/module.common";
import { AudioModule, AudioSystem } from "./audio/audio.game";
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
import { SceneModule, SceneUpdateSystem } from "./scene/scene.game";
import { ResourceModule } from "./resource/resource.game";
import { ThirdRoomModule } from "../plugins/thirdroom/thirdroom.game";
import { CameraModule, CameraUpdateSystem } from "./camera/camera.game";
import { LightModule, LightUpdateSystem } from "./light/light.game";
import { MaterialModule, MaterialUpdateSystem } from "./material/material.game";
import { TextureModule, TextureUpdateSystem } from "./texture/texture.game";

export default defineConfig<GameState>({
  modules: [
    ResourceModule,
    SceneModule,
    CameraModule,
    LightModule,
    MaterialModule,
    TextureModule,
    AudioModule,
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

    SceneUpdateSystem,
    CameraUpdateSystem,
    LightUpdateSystem,
    MaterialUpdateSystem,
    TextureUpdateSystem,
    RenderableSystem,
    ResetInputSystem,
  ],
});
