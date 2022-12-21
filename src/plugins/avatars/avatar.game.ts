import { addComponent, addEntity } from "bitecs";
import { quat } from "gl-matrix";

import { Transform, addChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { createGLTFEntity } from "../../engine/gltf/gltf.game";
import { getModule } from "../../engine/module/module.common";
import { addRemoteNodeComponent } from "../../engine/node/node.game";
import { PhysicsModule, PhysicsModuleState } from "../../engine/physics/physics.game";
import { addNametag } from "../nametags/nametags.game";
import { AvatarOptions, AVATAR_HEIGHT } from "./common";
import { AvatarComponent } from "./components";

export function createAvatar(ctx: GameState, uri: string, options: AvatarOptions = {}) {
  const physics = getModule(ctx, PhysicsModule);

  const container = addEntity(ctx.world);
  addRemoteNodeComponent(ctx, container);

  addAvatar(ctx, physics, uri, container, options);

  return container;
}

export function addAvatar(
  ctx: GameState,
  physics: PhysicsModuleState,
  uri: string,
  container: number,
  options: AvatarOptions = {}
) {
  const { height = AVATAR_HEIGHT, nametag = false } = options;

  if (nametag) addNametag(ctx, height, container);

  const eid = createGLTFEntity(ctx, uri, { createTrimesh: false, isStatic: false });
  addComponent(ctx.world, AvatarComponent, eid);

  Transform.position[eid].set([0, -1, 0]);
  quat.fromEuler(Transform.quaternion[eid], 0, Math.PI, 0);
  Transform.scale[eid].set([1.3, 1.3, 1.3]);

  addRemoteNodeComponent(ctx, container);
  addChild(container, eid);

  return eid;
}
