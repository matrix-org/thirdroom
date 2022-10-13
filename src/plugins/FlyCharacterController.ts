import { addEntity, addComponent, defineQuery } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";

import { createCamera } from "../engine/camera/camera.game";
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
import { InputModule } from "../engine/input/input.game";
import { getInputController, InputController } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";
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

export function createFlyPlayerRig(ctx: GameState, prefab: string, setActiveCamera = false) {
  const playerRig = addEntity(ctx.world);
  addTransformComponent(ctx.world, playerRig);

  // how this player looks to others
  addPrefabComponent(ctx.world, playerRig, prefab);

  return addFlyPlayerRig(ctx, playerRig, setActiveCamera);
}

const velocityVec = vec3.create();
const cameraWorldRotation = quat.create();

export function addFlyPlayerRig(ctx: GameState, playerRig: number, setActiveCamera = false) {
  addComponent(ctx.world, FlyRig, playerRig);
  FlyRig.set(playerRig, {
    speed: 10,
  });

  addCameraYawTargetComponent(ctx.world, playerRig);

  const camera = createCamera(ctx, setActiveCamera);
  addCameraPitchTargetComponent(ctx.world, camera);
  addChild(playerRig, camera);
  const cameraPosition = Transform.position[camera];
  cameraPosition[1] = 1.2;

  return playerRig;
}

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
