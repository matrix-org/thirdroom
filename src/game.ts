import { addComponent, addEntity } from "bitecs";
import RAPIER from "@dimforge/rapier3d-compat";

import { GameState } from "./engine/GameWorker";
import { ActionMappingSystem, ActionType, BindingType } from "./engine/input/ActionMappingSystem";
import {
  PhysicsCharacterControllerActions,
  playerControllerSystem,
  PlayerRig,
} from "./plugins/PhysicsCharacterController";
import {
  addCameraPitchTargetComponent,
  addCameraYawTargetComponent,
  FirstPersonCameraActions,
  FirstPersonCameraSystem,
} from "./plugins/FirstPersonCamera";
import { addChild, addRenderableComponent, addTransformComponent, Transform } from "./engine/component/transform";
import { CameraType, createRemoteCamera } from "./engine/resources/CameraResourceLoader";
import { addRigidBody, physicsSystem } from "./engine/physics";
import { createRemoteGeometry, GeometryType } from "./engine/resources/GeometryResourceLoader";
import { createCube } from "./engine/prefab";

export async function init(state: GameState): Promise<void> {
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

  const groundColliderDesc = RAPIER.ColliderDesc.cuboid(1000.0, 1, 1000.0);
  physicsWorld.createCollider(groundColliderDesc);

  const geometryResourceId = createRemoteGeometry(resourceManager, {
    type: "geometry",
    geometryType: GeometryType.Box,
  });

  for (let i = 0; i < 2000; i++) {
    const cube = createCube(state, geometryResourceId);
    addChild(scene, cube);
  }

  const playerRig = addEntity(world);
  addTransformComponent(world, playerRig);
  addComponent(world, PlayerRig, playerRig);
  Transform.position[playerRig][2] = 50;

  addCameraYawTargetComponent(world, playerRig);

  const playerRigPosition = Transform.position[playerRig];
  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic().setTranslation(
    playerRigPosition[0],
    playerRigPosition[1],
    playerRigPosition[2]
  );
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  physicsWorld.createCollider(colliderDesc, rigidBody.handle);
  addRigidBody(world, playerRig, rigidBody);

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

  function debugSystem(state: GameState) {}

  state.systems.push(ActionMappingSystem, FirstPersonCameraSystem, debugSystem, playerControllerSystem, physicsSystem);
}
