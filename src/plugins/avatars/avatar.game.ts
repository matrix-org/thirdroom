import { addComponent, addEntity } from "bitecs";
import { quat } from "gl-matrix";

import { addChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { createGLTFEntity } from "../../engine/gltf/gltf.game";
import { getModule } from "../../engine/module/module.common";
import { addRemoteNodeComponent } from "../../engine/node/node.game";
import { PhysicsModule, PhysicsModuleState } from "../../engine/physics/physics.game";
import { RemoteNode } from "../../engine/resource/schema";
import { addNametag } from "../nametags/nametags.game";
import { AvatarOptions, AVATAR_HEIGHT } from "./common";
import { AvatarComponent } from "./components";

export function createAvatar(ctx: GameState, uri: string, options: AvatarOptions = {}) {
  const physics = getModule(ctx, PhysicsModule);

  const container = addEntity(ctx.world);
  const node = addRemoteNodeComponent(ctx, container);
  addAvatar(ctx, physics, uri, node, options);

  return container;
}

export function addAvatar(
  ctx: GameState,
  physics: PhysicsModuleState,
  uri: string,
  container: RemoteNode,
  options: AvatarOptions = {}
) {
  const { height = AVATAR_HEIGHT, nametag = false } = options;

  if (nametag) addNametag(ctx, height, container);

  const node = createGLTFEntity(ctx, uri, { createTrimesh: false, isStatic: false, asNode: true });
  addComponent(ctx.world, AvatarComponent, node.resourceId);

  node.position.set([0, -1, 0]);
  quat.setAxisAngle(node.quaternion, [0, 1, 0], Math.PI);
  node.scale.set([1.3, 1.3, 1.3]);

  addChild(container, node);

  return node;
}
