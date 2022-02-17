import { World } from "./World";
import { defineComponent, defineQuery } from "bitecs";
import { Object3DComponent, getObject3D } from "./three";
import { PhysicsCharacterControllerActions } from "./physics-character-controller";
import { ButtonActionState } from "./input";

export const CrouchMeshTarget = defineComponent({});
export const CrouchCameraTarget = defineComponent({});

const crouchMeshesQuery = defineQuery([CrouchMeshTarget, Object3DComponent]);
const crouchCamerasQuery = defineQuery([CrouchCameraTarget, Object3DComponent]);

export function CrouchSystem(world: World) {
  const crouchMeshes = crouchMeshesQuery(world);
  const crouchCameras = crouchCamerasQuery(world);

  if (crouchMeshes.length === 0 || crouchCameras.length === 0) {
    return world;
  }

  const crouch = world.actions.get(
    PhysicsCharacterControllerActions.Crouch
  ) as ButtonActionState;

  const mesh = getObject3D(world, crouchMeshes[0]);
  const camera = getObject3D(world, crouchCameras[0]);

  if (crouch.pressed && crouch.held) {
    mesh.scale.set(1, 0.5, 1);
    camera.scale.set(1, 2, 1);
    camera.position.y = 0.8;
  } else if (crouch.released && !crouch.held) {
    mesh.scale.set(1, 1, 1);
    camera.scale.set(1, 1, 1);
    camera.position.y = 1.6;
  }

  return world;
}
