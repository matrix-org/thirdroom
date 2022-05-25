import { defineConfig } from "./module/module.common";
import { AudioModule, AudioSystem } from "./audio/audio.game";
import { InputModule, InputReadSystem } from "./input/input.game";
import { PhysicsModule, PhysicsSystem } from "./physics/physics.game";
import { InboundNetworkSystem, NetworkModule, OutboundNetworkSystem } from "./network/network.game";
import { GLTFLoaderSystem } from "./gltf/GLTFLoaderSystem";
import { ActionMappingSystem } from "./input/ActionMappingSystem";
import { FirstPersonCameraSystem } from "../plugins/FirstPersonCamera";
import { PlayerControllerSystem } from "../plugins/PhysicsCharacterController";
import { RenderableVisibilitySystem } from "./component/renderable";
import { CubeSpawnSystem, ExampleModule } from "../plugins/example/example";
import { GameWorkerStatsSystem, StatsModule } from "./stats/stats.game";
import { RaycasterModule, RaycasterSystem } from "./raycaster/raycaster.game";
import { EditorModule, EditorSelectionSystem, EditorStateSystem } from "./editor/editor.game";
import { GameState } from "./GameTypes";
import { RendererModule } from "./renderer/renderer.game";
import { RenderableSystem } from "./renderer/renderer.game";

export default defineConfig<GameState>({
  modules: [
    AudioModule,
    InputModule,
    PhysicsModule,
    NetworkModule,
    RaycasterModule,
    StatsModule,
    EditorModule,
    ExampleModule,
    RendererModule,
  ],
  systems: [
    InputReadSystem,
    RaycasterSystem,
    AudioSystem,

    InboundNetworkSystem,

    GLTFLoaderSystem,
    ActionMappingSystem,
    FirstPersonCameraSystem,
    PlayerControllerSystem,
    PhysicsSystem,
    RenderableVisibilitySystem,
    CubeSpawnSystem,

    EditorStateSystem,
    EditorSelectionSystem,

    OutboundNetworkSystem,

    RenderableSystem,
    GameWorkerStatsSystem,
  ],
});
