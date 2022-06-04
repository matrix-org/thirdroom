import { defineConfig } from "./module/module.common";
import { AudioModule, AudioSystem } from "./audio/audio.game";
import { ApplyInputSystem, InputModule, ResetInputSystem } from "./input/input.game";
import { PhysicsModule, PhysicsSystem } from "./physics/physics.game";
import { InboundNetworkSystem, NetworkModule, OutboundNetworkSystem } from "./network/network.game";
import { GLTFLoaderSystem } from "./gltf/GLTFLoaderSystem";
import { ActionMappingSystem } from "./input/ActionMappingSystem";
import { FirstPersonCameraModule, FirstPersonCameraSystem } from "../plugins/FirstPersonCamera";
import { PhysicsCharacterControllerModule, PlayerControllerSystem } from "../plugins/PhysicsCharacterController";
import { RenderableVisibilitySystem } from "./component/renderable";
import { GameWorkerStatsSystem, StatsModule } from "./stats/stats.game";
import { RaycasterModule, RaycasterSystem } from "./raycaster/raycaster.game";
import { EditorModule, EditorSelectionSystem, EditorStateSystem } from "./editor/editor.game";
import { GameState } from "./GameTypes";
import { RenderableSystem, RendererModule } from "./renderer/renderer.game";
import { CubeSpawnerModule, CubeSpawnerSystem } from "../plugins/CubeSpawner";
import { SceneModule, SceneUpdateSystem } from "./scene/scene.game";
import { ResourceModule } from "./resource/resource.game";
import { ThirdRoomModule } from "../plugins/thirdroom/thirdroom.game";
import { CameraModule, CameraUpdateSystem } from "./camera/camera.game";
import { LightModule, LightUpdateSystem } from "./light/light.game";

export default defineConfig<GameState>({
  modules: [
    ResourceModule,
    SceneModule,
    CameraModule,
    LightModule,
    AudioModule,
    InputModule,
    PhysicsModule,
    NetworkModule,
    RaycasterModule,
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
    RaycasterSystem,
    AudioSystem,

    InboundNetworkSystem,

    GLTFLoaderSystem,
    FirstPersonCameraSystem,
    PlayerControllerSystem,
    PhysicsSystem,
    RenderableVisibilitySystem,
    CubeSpawnerSystem,

    EditorStateSystem,
    EditorSelectionSystem,

    OutboundNetworkSystem,

    GameWorkerStatsSystem,

    SceneUpdateSystem,
    CameraUpdateSystem,
    LightUpdateSystem,
    RenderableSystem,
    ResetInputSystem,
  ],
});
