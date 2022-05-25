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
import { RenderableTripleBufferSystem, UpdateWorldMatrixSystem, TimeSystem } from "./GameSystems";
import { GameState } from "./GameTypes";

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
  ],
  systems: [
    TimeSystem,
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

    UpdateWorldMatrixSystem,
    RenderableTripleBufferSystem,
    GameWorkerStatsSystem,
  ],
});
