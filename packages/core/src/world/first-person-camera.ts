import { Vector2, MathUtils } from "three";
import { defineQuery, defineComponent, Types, TypedArray } from "bitecs";
import { World } from "./World";
import { getObject3D, Object3DComponent } from "./three";

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

export const cameraPitchTargetQuery = defineQuery([
  FirstPersonCameraPitchTarget,
  Object3DComponent,
]);
export const cameraYawTargetQuery = defineQuery([
  FirstPersonCameraYawTarget,
  Object3DComponent,
]);

export function FirstPersonCameraSystem(world: World) {
  const lookVec = world.actions.get(FirstPersonCameraActions.Look) as Vector2;

  const pitchEntities = cameraPitchTargetQuery(world);

  if (Math.abs(lookVec.y) > 1) {
    pitchEntities.forEach((eid) => {
      const obj = getObject3D(world, eid);
      const sensitivity = (
        FirstPersonCameraPitchTarget.sensitivity as TypedArray
      )[eid];
      const maxAngle = (FirstPersonCameraPitchTarget.maxAngle as TypedArray)[
        eid
      ];
      const minAngle = (FirstPersonCameraPitchTarget.minAngle as TypedArray)[
        eid
      ];
      const maxAngleRads = MathUtils.degToRad(maxAngle || 89);
      const minAngleRads = MathUtils.degToRad(minAngle || -89);
      obj.rotation.x -= lookVec.y / (1000 / (sensitivity || 1));

      if (obj.rotation.x > maxAngleRads) {
        obj.rotation.x = maxAngleRads;
      } else if (obj.rotation.x < minAngleRads) {
        obj.rotation.x = minAngleRads;
      }
    });
  }

  const yawEntities = cameraYawTargetQuery(world);

  if (Math.abs(lookVec.x) > 1) {
    yawEntities.forEach((eid) => {
      const obj = getObject3D(world, eid);
      const sensitivity = (
        FirstPersonCameraYawTarget.sensitivity as TypedArray
      )[eid];
      obj.rotation.y -= lookVec.x / (1000 / (sensitivity || 1));
    });
  }

  return world;
}
