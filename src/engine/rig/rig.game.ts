/**
 * A "rig" is an entity containing a camera with pitch/yaw components
 */

import { addEntity } from "bitecs";

import { addCameraYawTargetComponent, addCameraPitchTargetComponent } from "../../plugins/FirstPersonCamera";
import { createCamera } from "../camera/camera.game";
import { addChild } from "../component/transform";
import { GameState } from "../GameTypes";
import { GameInputModule } from "../input/input.game";
import { addRemoteNodeComponent } from "../node/node.game";

export const createRig = (ctx: GameState, input: GameInputModule) => {
  const rig = addEntity(ctx.world);
  const rigNode = addRemoteNodeComponent(ctx, rig);

  const camera = createCamera(ctx);
  camera.position[1] = 1.2;
  addChild(rigNode, camera);

  addCameraYawTargetComponent(ctx.world, rig);
  addCameraPitchTargetComponent(ctx.world, camera);

  return rig;
};
