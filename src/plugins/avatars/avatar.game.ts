import { addComponent } from "bitecs";
import { quat } from "gl-matrix";

import { addChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { createGLTFEntity } from "../../engine/gltf/gltf.game";
import { RemoteNode } from "../../engine/resource/resource.game";
import { addNametag } from "../nametags/nametags.game";
import { AvatarOptions, AVATAR_HEIGHT } from "./common";
import { AvatarComponent } from "./components";

export function addAvatar(ctx: GameState, uri: string, rig: RemoteNode, options: AvatarOptions = {}): RemoteNode {
  const { height = AVATAR_HEIGHT, nametag = false } = options;

  if (nametag) addNametag(ctx, height, rig);

  const avatar = createGLTFEntity(ctx, uri, { createTrimesh: false, isStatic: false });
  addComponent(ctx.world, AvatarComponent, avatar.eid);

  avatar.position.set([0, -1, 0]);
  quat.fromEuler(avatar.quaternion, 0, 180, 0);
  avatar.scale.set([1.3, 1.3, 1.3]);

  addChild(ctx, rig, avatar);

  return avatar;
}
