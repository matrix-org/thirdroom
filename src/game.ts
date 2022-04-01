import { addEntity } from "bitecs";
import RAPIER from "@dimforge/rapier3d-compat";

import { GameState } from "./engine/GameWorker";
import { ActionMappingSystem, ActionType, BindingType } from "./engine/input/ActionMappingSystem";
import { PhysicsCharacterControllerActions } from "./plugins/PhysicsCharacterController";
import {
  addCameraPitchTargetComponent,
  addCameraYawTargetComponent,
  FirstPersonCameraActions,
  FirstPersonCameraSystem,
} from "./plugins/FirstPersonCamera";
import { addChild, addRenderableComponent, addTransformComponent, Transform } from "./engine/component/transform";
import { CameraType, createRemoteCamera } from "./engine/resources/CameraResourceLoader";
import { physicsSystem } from "./engine/physics";
import { createRemoteGeometry, GeometryType } from "./engine/resources/GeometryResourceLoader";
import { createCube } from "./engine/prefab";

// import {
//   addPhysicsCharacterController,
//   PhysicsCharacterControllerSystem,
// } from "./plugins/physics-character-controller";

export async function init(state: GameState): Promise<void> {
  //addPhysicsCharacterController(state);

  const { world, resourceManager, physicsWorld, scene } = state;

  state.input.actionMaps = [
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
      ],
    },
  ];

  const groundColliderDesc = RAPIER.ColliderDesc.cuboid(100.0, 0.1, 100.0);
  physicsWorld.createCollider(groundColliderDesc);

  const geometryResourceId = createRemoteGeometry(resourceManager, {
    type: "geometry",
    geometryType: GeometryType.Box,
  });

  for (let i = 0; i < 1000; i++) {
    const cube = createCube(state, geometryResourceId);
    addChild(scene, cube);
  }

  const playerRig = addEntity(world);
  addTransformComponent(world, playerRig);
  addCameraYawTargetComponent(world, playerRig);
  Transform.position[playerRig][2] = 50;
  addChild(scene, playerRig);

  const camera = addEntity(world);
  addTransformComponent(world, camera);
  const cameraResource = createRemoteCamera(resourceManager, {
    type: "camera",
    cameraType: CameraType.Perspective,
    yfov: 75,
    znear: 0.1,
  });
  addRenderableComponent(state, camera, cameraResource);
  addCameraPitchTargetComponent(world, camera);
  addChild(playerRig, camera);
  const cameraPosition = Transform.position[camera];
  cameraPosition[1] = 1.6;

  function debugSystem(state: GameState) {
    // console.log(state.input.actions.get(FirstPersonCameraActions.Look));
  }

  state.systems.push(ActionMappingSystem, FirstPersonCameraSystem, debugSystem, physicsSystem);
}
