import { defineComponent, defineQuery, Types } from "bitecs";
import { vec2, glMatrix as glm } from "gl-matrix";

import { Transform } from "../engine/component/transform";
import { GameState } from "../engine/GameWorker";

export const FirstPersonCameraActions = {
  Look: "FirstPersonCamera/Look",
};

export const FirstPersonCameraPitchTarget = defineComponent({
  maxAngle: Types.f32,
  minAngle: Types.f32,
  sensitivity: Types.f32,
});
export const FirstPersonCameraYawTarget = defineComponent({
  sensitivity: Types.f32,
});

export const cameraPitchTargetQuery = defineQuery([FirstPersonCameraPitchTarget, Transform]);
export const cameraYawTargetQuery = defineQuery([FirstPersonCameraYawTarget, Transform]);

export function FirstPersonCameraSystem({ input, world }: GameState) {
  const [lookX, lookY] = input.actions.get(FirstPersonCameraActions.Look) as vec2;

  const pitchEntities = cameraPitchTargetQuery(world);

  if (Math.abs(lookY) > 1) {
    pitchEntities.forEach((eid) => {
      const rotation = Transform.rotation[eid];
      const sensitivity = FirstPersonCameraPitchTarget.sensitivity[eid];
      const maxAngle = FirstPersonCameraPitchTarget.maxAngle[eid];
      const minAngle = FirstPersonCameraPitchTarget.minAngle[eid];
      const maxAngleRads = glm.toRadian(maxAngle || 89);
      const minAngleRads = glm.toRadian(minAngle || -89);
      rotation[0] -= lookY / (1000 / (sensitivity || 1));

      if (rotation[0] > maxAngleRads) {
        rotation[0] = maxAngleRads;
      } else if (rotation[0] < minAngleRads) {
        rotation[0] = minAngleRads;
      }
    });
  }

  const yawEntities = cameraYawTargetQuery(world);

  if (Math.abs(lookX) > 1) {
    yawEntities.forEach((eid) => {
      const sensitivity = FirstPersonCameraYawTarget.sensitivity[eid];
      Transform.rotation[eid][1] -= lookX / (1000 / (sensitivity || 1));
    });
  }

  return world;
}
