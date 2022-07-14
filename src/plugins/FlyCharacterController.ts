import { addEntity, addComponent, defineQuery } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";

import { createCamera } from "../engine/camera/camera.game";
import { Player } from "../engine/component/Player";
import { addTransformComponent, Transform, addChild, updateMatrixWorld } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { defineModule, getModule } from "../engine/module/module.common";
import { NetworkModule, Owned, Networked } from "../engine/network/network.game";
import { Prefab } from "../engine/prefab/prefab.game";
import { addCameraYawTargetComponent, addCameraPitchTargetComponent } from "./FirstPersonCamera";

type FlyCharacterControllerModuleState = {};

export const FlyCharacterControllerModule = defineModule<GameState, FlyCharacterControllerModuleState>({
  name: "fly-character-controller",
  create() {
    return {};
  },
  init(ctx) {
    enableActionMap(ctx, FlyCharacterControllerActionMap);
  },
});

interface IFlyPlayerRig {
  speed: number;
}

export const FlyPlayerRig: Map<number, IFlyPlayerRig> = new Map();

export function createFlyPlayerRig(state: GameState, setActiveCamera = true) {
  const { world } = state;
  const network = getModule(state, NetworkModule);

  const playerRig = addEntity(world);
  addTransformComponent(world, playerRig);

  // how this player looks to others
  Prefab.set(playerRig, Math.random() > 0.5 ? "mixamo-x" : "mixamo-y");

  network.peerIdToEntityId.set(network.peerId, playerRig);

  addComponent(world, FlyPlayerRig, playerRig);
  FlyPlayerRig.set(playerRig, {
    speed: 10,
  });

  addCameraYawTargetComponent(world, playerRig);

  const camera = createCamera(state, setActiveCamera);
  addCameraPitchTargetComponent(world, camera);
  addChild(playerRig, camera);
  const cameraPosition = Transform.position[camera];
  cameraPosition[1] = 1.2;

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  addComponent(world, Owned, playerRig);
  addComponent(world, Player, playerRig);
  addComponent(world, Networked, playerRig, true);

  return playerRig;
}

export const flyPlayerRigQuery = defineQuery([FlyPlayerRig]);

const velocityVec = vec3.create();
const cameraWorldRotation = quat.create();

export function FlyControlsSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  const playerRig = flyPlayerRigQuery(ctx.world)[0];

  if (!playerRig) {
    return;
  }

  const { speed } = FlyPlayerRig.get(playerRig)!;

  const moveVec = input.actions.get(FlyCharacterControllerActions.Move) as Float32Array;
  const boost = input.actions.get(FlyCharacterControllerActions.Boost) as ButtonActionState;

  const boostModifier = boost.held ? 2 : 1;

  vec3.set(velocityVec, moveVec[0], 0, -moveVec[1]);
  updateMatrixWorld(ctx.activeCamera);
  mat4.getRotation(cameraWorldRotation, Transform.worldMatrix[ctx.activeCamera]);
  vec3.transformQuat(velocityVec, velocityVec, cameraWorldRotation);
  vec3.normalize(velocityVec, velocityVec);
  vec3.scale(velocityVec, velocityVec, ctx.dt * speed * boostModifier);
  vec3.add(Transform.position[playerRig], Transform.position[playerRig], velocityVec);
}

export const FlyCharacterControllerActions = {
  Move: "FlyCharacterController/Move",
  Boost: "FlyCharacterController/Boost",
};

export const FlyCharacterControllerActionMap: ActionMap = {
  id: "fly-character-controller",
  actions: [
    {
      id: "move",
      path: FlyCharacterControllerActions.Move,
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
      id: "boost",
      path: FlyCharacterControllerActions.Boost,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/ShiftLeft",
        },
      ],
    },
  ],
};
