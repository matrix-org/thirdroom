import { addEntity, addComponent, defineQuery } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";

import { createCamera } from "../engine/camera/camera.game";
import { Player } from "../engine/component/Player";
import {
  addTransformComponent,
  Transform,
  addChild,
  updateMatrixWorld,
  getChildAt,
} from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../engine/input/ActionMappingSystem";
import { getInputController, InputModule } from "../engine/input/input.game";
import { InputController } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";
import { NetworkModule, Owned, Networked, associatePeerWithEntity } from "../engine/network/network.game";
import { addPrefabComponent } from "../engine/prefab/prefab.game";
import { addCameraYawTargetComponent, addCameraPitchTargetComponent } from "./FirstPersonCamera";

type FlyCharacterControllerModuleState = {};

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

export const FlyCharacterControllerModule = defineModule<GameState, FlyCharacterControllerModuleState>({
  name: "fly-character-controller",
  create() {
    return {};
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, FlyCharacterControllerActionMap);
  },
});

interface IFlyPlayerRig {
  speed: number;
}

export const FlyRig: Map<number, IFlyPlayerRig> = new Map();
export const flyRigQuery = defineQuery([FlyRig]);

export function createFlyPlayerRig(state: GameState, prefab: string, setActiveCamera = true) {
  const { world } = state;
  const network = getModule(state, NetworkModule);

  const playerRig = addEntity(world);
  addTransformComponent(world, playerRig);

  // how this player looks to others
  addPrefabComponent(world, playerRig, prefab);

  associatePeerWithEntity(network, network.peerId, playerRig);

  addComponent(world, FlyRig, playerRig);
  FlyRig.set(playerRig, {
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
  // Networked component isn't reset when removed so reset on add
  addComponent(world, Networked, playerRig, true);

  return playerRig;
}

const velocityVec = vec3.create();
const cameraWorldRotation = quat.create();

function applyFlyController(playerRig: number, controller: InputController, camera: number, ctx: GameState) {
  const { speed } = FlyRig.get(playerRig)!;
  const moveVec = controller.actions.get(FlyCharacterControllerActions.Move) as Float32Array;
  const boost = controller.actions.get(FlyCharacterControllerActions.Boost) as ButtonActionState;

  const boostModifier = boost.held ? 2 : 1;

  vec3.set(velocityVec, moveVec[0], 0, -moveVec[1]);

  updateMatrixWorld(camera);

  mat4.getRotation(cameraWorldRotation, Transform.worldMatrix[camera]);
  vec3.transformQuat(velocityVec, velocityVec, cameraWorldRotation);
  vec3.normalize(velocityVec, velocityVec);
  vec3.scale(velocityVec, velocityVec, ctx.dt * speed * boostModifier);
  vec3.add(Transform.position[playerRig], Transform.position[playerRig], velocityVec);
}

export function FlyControllerSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  const ents = flyRigQuery(ctx.world);

  for (let i = 0; i < ents.length; i++) {
    const playerRig = ents[i];
    const camera = getChildAt(playerRig, 0);

    const controller = getInputController(input, playerRig);

    applyFlyController(playerRig, controller, camera, ctx);
  }
}
