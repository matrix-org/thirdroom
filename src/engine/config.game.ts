import { defineConfig } from "./module/module.common";
import { GameAudioModule, GameAudioSystem } from "./audio/audio.game";
import { ApplyInputSystem, InputModule, ResetInputSystem } from "./input/input.game";
import { PhysicsModule, PhysicsSystem, RigidBody, RigidBodySoA } from "./physics/physics.game";
import { InboundNetworkSystem, Networked, NetworkModule, OutboundNetworkSystem, Owned } from "./network/network.game";
import { ActionMappingSystem } from "./input/ActionMappingSystem";
import {
  FirstPersonCameraModule,
  FirstPersonCameraPitchTarget,
  FirstPersonCameraSystem,
  FirstPersonCameraYawTarget,
} from "../plugins/FirstPersonCamera";
import {
  PhysicsCharacterControllerModule,
  PlayerControllerSystem,
  PlayerRig,
} from "../plugins/PhysicsCharacterController";
import { GameWorkerStatsSystem, StatsModule } from "./stats/stats.game";
import {
  EditorModule,
  //EditorSelectionSystem,
  EditorStateSystem,
  Selected,
} from "./editor/editor.game";
import { GameState } from "./GameTypes";
import { RenderableSystem, RendererModule } from "./renderer/renderer.game";
import { CubeSpawnerModule, CubeSpawnerSystem } from "../plugins/CubeSpawner";
import { ResourceLoaderSystem, ResourceModule } from "./resource/resource.game";
import { ThirdRoomModule } from "../plugins/thirdroom/thirdroom.game";
import { RemoteNodeComponent, RemoteNodeSystem } from "./node/node.game";
import { Transform, UpdateMatrixWorldSystem } from "./component/transform";
import { RemoteSceneComponent, RemoteSceneSystem } from "./scene/scene.game";
import { GrabComponent, GrabThrowModule, GrabThrowSystem } from "../plugins/GrabThrowController";
import { FlyCharacterControllerModule, FlyControlsSystem, FlyPlayerRig } from "../plugins/FlyCharacterController";
import { NetworkTransformSystem } from "./network/NetworkTransformSystem";
import { Prefab, PrefabDisposalSystem, PrefabModule } from "./prefab/prefab.game";
import { Name, NameSystem } from "./component/Name";
import { Player } from "./component/Player";
import { SpawnPoint } from "./component/SpawnPoint";

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
  ],
  components: [
    Name, // Map component
    Player, // Tag component
    SpawnPoint, // Tag component
    Transform, // SoA component with two triplebuffers
    Selected, // Tag component
    Networked, // SoA component
    Owned, // Tag component
    RemoteNodeComponent, // Map component with resource refs
    RigidBody, // Map component, tied loosly with RigidBodySoA
    RigidBodySoA, // SoA component tied loosly with RigidBody
    Prefab, // Map component
    RemoteSceneComponent, // Map component with resource refs
    FirstPersonCameraPitchTarget, // SoA component
    FirstPersonCameraYawTarget, // SoA component
    FlyPlayerRig, // Map component
    GrabComponent, // SoA component
    PlayerRig, // Tag component
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
    PrefabDisposalSystem,
    NameSystem,

    ResetInputSystem,
    GameWorkerStatsSystem,
  ],
});
