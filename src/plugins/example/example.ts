import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, removeEntity, defineQuery } from "bitecs";
import { mat4, vec3, quat } from "gl-matrix";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import { addChild, setEulerFromQuaternion, Transform } from "../../engine/component/transform";
import { GameState, IInitialGameThreadState } from "../../engine/GameWorker";
import { createGLTFEntity } from "../../engine/gltf/GLTFLoader";
import { ActionType, BindingType, ButtonActionState } from "../../engine/input/ActionMappingSystem";
import { InputModule } from "../../engine/input/input.game";
import { defineModule, getModule, registerMessageHandler } from "../../engine/module/module.common";
import { Networked, NetworkModule, Owned } from "../../engine/network/network.game";
import { RigidBody } from "../../engine/physics/physics.game";
import { createCube, createScene, getPrefabTemplate } from "../../engine/prefab";
import { StateChangedMessage, WorkerMessageType } from "../../engine/WorkerMessage";
import { FirstPersonCameraActions } from "../FirstPersonCamera";
import { createPlayerRig, PhysicsCharacterControllerActions } from "../PhysicsCharacterController";

type ExampleModuleState = {};

export const ExampleModule = defineModule<GameState, IInitialGameThreadState, ExampleModuleState>({
  create() {
    return {};
  },
  init(state) {
    registerMessageHandler(state, WorkerMessageType.StateChanged, onStateChange);

    const input = getModule(state, InputModule);

    input.actionMaps = [
      {
        id: "movement",
        actions: [
          {
            id: "look",
            path: FirstPersonCameraActions.Look,
            type: ActionType.Vector2,
            bindings: [
              {
                type: BindingType.Axes,
                x: "Mouse/movementX",
                y: "Mouse/movementY",
              },
            ],
          },
          {
            id: "move",
            path: PhysicsCharacterControllerActions.Move,
            type: ActionType.Vector2,
            bindings: [
              {
                type: BindingType.DirectionalButtons,
                up: "Keyboard/KeyW",
                down: "Keyboard/KeyS",
                left: "Keyboard/KeyA",
                right: "Keyboard/KeyD",
              },
            ],
          },
          {
            id: "jump",
            path: PhysicsCharacterControllerActions.Jump,
            type: ActionType.Button,
            bindings: [
              {
                type: BindingType.Button,
                path: "Keyboard/Space",
              },
            ],
          },
          {
            id: "crouch",
            path: PhysicsCharacterControllerActions.Crouch,
            type: ActionType.Button,
            bindings: [
              {
                type: BindingType.Button,
                path: "Keyboard/KeyC",
              },
            ],
          },
          {
            id: "sprint",
            path: PhysicsCharacterControllerActions.Sprint,
            type: ActionType.Button,
            bindings: [
              {
                type: BindingType.Button,
                path: "Keyboard/ShiftLeft",
              },
            ],
          },
          {
            id: "spawnCube",
            path: "SpawnCube",
            type: ActionType.Button,
            bindings: [
              {
                type: BindingType.Button,
                path: "Keyboard/KeyF",
              },
            ],
          },
        ],
      },
    ];

    const scene = createScene(state, {
      environmentMapUrl: "/cubemap/venice_sunset_1k.hdr",
    });

    for (let i = 0; i < 0; i++) {
      const cube = createCube(state);

      const position = Transform.position[cube];
      const rotation = Transform.rotation[cube];

      position[0] = rndRange(-10, 10);
      position[1] = rndRange(5, 50);
      position[2] = rndRange(-10, 10);

      rotation[0] = rndRange(0, 5);
      rotation[1] = rndRange(0, 5);
      rotation[2] = rndRange(0, 5);

      const body = RigidBody.store.get(cube);
      if (body) {
        body.setTranslation(new RAPIER.Vector3(position[0], position[1], position[2]), true);
      }

      addChild(scene, cube);
    }

    createGLTFEntity(state, "/gltf/modern_city_block_fixed/modern_city_block.gltf", scene);
  },
});

const waitUntil = (fn: Function) =>
  new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (fn()) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });

const rndRange = (min: number, max: number) => Math.random() * (max - min) + min;

let playerRig: number;

const spawnPointQuery = defineQuery([SpawnPoint]);

async function onStateChange(state: GameState, message: StateChangedMessage) {
  const { scene, world } = state;
  const network = getModule(state, NetworkModule);

  await waitUntil(() => network.peerIdToIndex.has(network.peerId));

  if (message.state.joined && !playerRig) {
    const spawnPoints = spawnPointQuery(world);

    playerRig = createPlayerRig(state);
    vec3.copy(Transform.position[playerRig], Transform.position[spawnPoints[0]]);
    vec3.copy(Transform.quaternion[playerRig], Transform.quaternion[spawnPoints[0]]);
    setEulerFromQuaternion(Transform.rotation[playerRig], Transform.quaternion[playerRig]);
    addChild(scene, playerRig);
  } else if (!message.state.joined && playerRig) {
    //removeChild(scene, playerRig);
  }
}

export const CubeSpawnSystem = (state: GameState) => {
  const input = getModule(state, InputModule);
  const spawnCube = input.actions.get("SpawnCube") as ButtonActionState;
  if (spawnCube.pressed) {
    const cube = getPrefabTemplate(state, "blue-cube")?.create();

    addComponent(state.world, Networked, cube);
    // addComponent(state.world, NetworkTransform, cube);
    addComponent(state.world, Owned, cube);

    mat4.getTranslation(Transform.position[cube], Transform.worldMatrix[state.camera]);

    const worldQuat = quat.create();
    mat4.getRotation(worldQuat, Transform.worldMatrix[state.camera]);
    const direction = vec3.set(vec3.create(), 0, 0, -1);
    vec3.transformQuat(direction, direction, worldQuat);
    vec3.scale(direction, direction, 10);
    RigidBody.store.get(cube)?.applyImpulse(new RAPIER.Vector3(direction[0], direction[1], direction[2]), true);

    addChild(state.scene, cube);

    setTimeout(() => {
      removeEntity(state.world, cube);
    }, 3000);
  }
};
