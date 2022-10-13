import { addComponent, defineComponent, defineQuery, Types } from "bitecs";
import { vec2, glMatrix as glm } from "gl-matrix";

import { setQuaternionFromEuler, Transform } from "../engine/component/transform";
import { GameState, World } from "../engine/GameTypes";
import { enableActionMap, ActionMap, ActionType, BindingType } from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { getInputController, InputController } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";

type FirstPersonCameraModuleState = {};

export const FirstPersonCameraModule = defineModule<GameState, FirstPersonCameraModuleState>({
  name: "first-person-camera",
  create() {
    return {};
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, FirstPersonCameraActionMap);
  },
});

export const FirstPersonCameraActions = {
  Look: "FirstPersonCamera/Look",
};

export const FirstPersonCameraActionMap: ActionMap = {
  id: "first-person-camera",
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
  ],
};

export const FirstPersonCameraPitchTarget = defineComponent({
  maxAngle: Types.f32,
  minAngle: Types.f32,
  sensitivity: Types.f32,
});
export const FirstPersonCameraYawTarget = defineComponent({
  sensitivity: Types.f32,
});

const DEFAULT_SENSITIVITY = 100;

export function addCameraPitchTargetComponent(world: World, eid: number) {
  addComponent(world, FirstPersonCameraPitchTarget, eid);
  FirstPersonCameraPitchTarget.maxAngle[eid] = 89;
  FirstPersonCameraPitchTarget.minAngle[eid] = -89;
  FirstPersonCameraPitchTarget.sensitivity[eid] = DEFAULT_SENSITIVITY;
}

export function addCameraYawTargetComponent(world: World, eid: number) {
  addComponent(world, FirstPersonCameraYawTarget, eid);
  FirstPersonCameraYawTarget.sensitivity[eid] = DEFAULT_SENSITIVITY;
}

export const cameraPitchTargetQuery = defineQuery([FirstPersonCameraPitchTarget, Transform]);
export const cameraYawTargetQuery = defineQuery([FirstPersonCameraYawTarget, Transform]);

function applyYaw(ctx: GameState, controller: InputController, eid: number) {
  const [lookX] = controller.actions.get(FirstPersonCameraActions.Look) as vec2;

  if (Math.abs(lookX) >= 1) {
    const sensitivity = FirstPersonCameraYawTarget.sensitivity[eid] || 1;
    Transform.rotation[eid][1] -= (lookX / (1000 / (sensitivity || 1))) * ctx.dt;
    setQuaternionFromEuler(Transform.quaternion[eid], Transform.rotation[eid]);
  }
}

function applyPitch(ctx: GameState, controller: InputController, eid: number) {
  const [, lookY] = controller.actions.get(FirstPersonCameraActions.Look) as vec2;

  if (Math.abs(lookY) >= 1) {
    const rotation = Transform.rotation[eid];
    const sensitivity = FirstPersonCameraPitchTarget.sensitivity[eid] || DEFAULT_SENSITIVITY;
    const maxAngle = FirstPersonCameraPitchTarget.maxAngle[eid];
    const minAngle = FirstPersonCameraPitchTarget.minAngle[eid];
    const maxAngleRads = glm.toRadian(maxAngle || 89);
    const minAngleRads = glm.toRadian(minAngle || -89);
    rotation[0] -= (lookY / (1000 / (sensitivity || 1))) * ctx.dt;

    if (rotation[0] > maxAngleRads) {
      rotation[0] = maxAngleRads;
    } else if (rotation[0] < minAngleRads) {
      rotation[0] = minAngleRads;
    }

    setQuaternionFromEuler(Transform.quaternion[eid], Transform.rotation[eid]);
  }
}

export function FirstPersonCameraSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);

  const pitchEntities = cameraPitchTargetQuery(ctx.world);
  for (let i = 0; i < pitchEntities.length; i++) {
    const eid = pitchEntities[i];
    // pitch target on camera, controller is on the parent of the camera
    const parent = Transform.parent[eid];
    const controller = getInputController(input, parent);
    applyPitch(ctx, controller, eid);
  }

  const yawEntities = cameraYawTargetQuery(ctx.world);
  for (let i = 0; i < yawEntities.length; i++) {
    const eid = yawEntities[i];
    const controller = getInputController(input, eid);
    applyYaw(ctx, controller, eid);
  }
}
