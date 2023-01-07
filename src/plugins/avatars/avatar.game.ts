import { addComponent } from "bitecs";
import { quat } from "gl-matrix";

import { addChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { createNodeFromGLTFURI } from "../../engine/gltf/gltf.game";
import { RemoteNode } from "../../engine/resource/resource.game";
import { AvatarComponent } from "./components";

export function addAvatar(ctx: GameState, uri: string, rig: RemoteNode): RemoteNode {
  const avatar = createNodeFromGLTFURI(ctx, uri);
  addComponent(ctx.world, AvatarComponent, avatar.eid);

  avatar.position.set([0, -1, 0]);
  quat.fromEuler(avatar.quaternion, 0, 180, 0);
  avatar.scale.set([1.3, 1.3, 1.3]);

  addChild(rig, avatar);

  return avatar;
}
