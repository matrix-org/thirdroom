import { addComponent, defineQuery } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";

import { getCamera } from "../engine/camera/camera.game";
import { Transform, updateMatrixWorld } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { getInputController, InputController } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";

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

export const FlyControls: Map<number, IFlyPlayerRig> = new Map();
export const flyControlsQuery = defineQuery([FlyControls]);

const velocityVec = vec3.create();
const cameraWorldRotation = quat.create();

export function addFlyControls(ctx: GameState, eid: number) {
  addComponent(ctx.world, FlyControls, eid);
  FlyControls.set(eid, {
    speed: 10,
  });
  return eid;
}

function applyFlyControls(playerRig: number, controller: InputController, camera: number, ctx: GameState) {
  const { speed } = FlyControls.get(playerRig)!;
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
  const ents = flyControlsQuery(ctx.world);

  for (let i = 0; i < ents.length; i++) {
    const playerRig = ents[i];
    const camera = getCamera(ctx, playerRig);
    const controller = getInputController(input, playerRig);

    applyFlyControls(playerRig, controller, camera, ctx);
  }
}
