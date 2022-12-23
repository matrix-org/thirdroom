import { hasComponent } from "bitecs";

import { findChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { RemoteNode } from "../../engine/resource/resource.game";
import { AvatarComponent } from "./components";

export function getAvatar(ctx: GameState, node: RemoteNode) {
  const avatar = findChild(node, (child) => hasComponent(ctx.world, AvatarComponent, child.eid));
  if (!avatar) throw new Error("avatar not found for entity " + node.name);
  return avatar;
}
