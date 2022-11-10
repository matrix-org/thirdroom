/**
 * A "rig" is an entity containing a camera with pitch/yaw components
 */

import { addEntity } from "bitecs";

import { addCameraYawTargetComponent, addCameraPitchTargetComponent } from "../../plugins/FirstPersonCamera";
import { createCamera } from "../camera/camera.game";
import { addTransformComponent, addChild, Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { GameInputModule } from "../input/input.game";

export const createRig = (ctx: GameState, input: GameInputModule) => {
  const rig = addEntity(ctx.world);
  addTransformComponent(ctx.world, rig);

  const camera = createCamera(ctx);
  Transform.position[camera][1] = 1.2;
  addChild(rig, camera);

  addCameraYawTargetComponent(ctx.world, rig);
  addCameraPitchTargetComponent(ctx.world, camera);

  return rig;
};
