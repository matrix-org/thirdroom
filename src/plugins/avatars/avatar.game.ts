import { addComponent } from "bitecs";
import { quat } from "gl-matrix";

import { Transform, addChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { createGLTFEntity } from "../../engine/gltf/gltf.game";
import { addRemoteNodeComponent } from "../../engine/node/node.game";
import { PhysicsModuleState } from "../../engine/physics/physics.game";
import { addNametag } from "../nametags/nametags.game";
import { AvatarOptions, AVATAR_HEIGHT } from "./common";
import { AvatarComponent } from "./components";

export function addAvatar(
  ctx: GameState,
  physics: PhysicsModuleState,
  uri: string,
  container: number,
  options: AvatarOptions = {}
) {
  const { height = AVATAR_HEIGHT, nametag = false } = options;

  addRemoteNodeComponent(ctx, container);

  if (nametag) addNametag(ctx, height, container);

  const eid = createGLTFEntity(ctx, uri, { createTrimesh: false, isStatic: false });
  addComponent(ctx.world, AvatarComponent, eid);

  Transform.position[eid].set([0, -1, 0]);
  quat.fromEuler(Transform.quaternion[eid], 0, 180, 0);
  Transform.scale[eid].set([1.3, 1.3, 1.3]);

  addChild(container, eid);

  return eid;
}
