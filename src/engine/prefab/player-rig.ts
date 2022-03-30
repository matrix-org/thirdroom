import {
  PerspectiveCameraEntity,
  FirstPersonCameraYawTarget,
  FirstPersonCameraPitchTarget,
  addComponent,
  addPhysicsCharacterControllerEntity,
} from "threecs";

import { ThreeWorld } from "./createThreeWorld";

export function createPlayerRig(world: ThreeWorld) {
  const playerCamera = new PerspectiveCameraEntity(world);
  playerCamera.name = "Player Camera";
  const playerRig = addPhysicsCharacterControllerEntity(world);
  playerRig.name = "Player Rig";
  addComponent(world, FirstPersonCameraYawTarget, playerRig.eid);
  addComponent(world, FirstPersonCameraPitchTarget, playerCamera.eid);
  playerRig.add(playerCamera);
  playerCamera.position.set(0, 1.6, 0);
  return { playerRig, playerCamera };
}
