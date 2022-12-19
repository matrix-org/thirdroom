import { hasComponent } from "bitecs";

import { findChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { RemoteNode } from "../../engine/resource/schema";
import { AvatarComponent } from "./components";

export function getAvatar(ctx: GameState, node: RemoteNode) {
  const avatar = findChild(node, (child) => hasComponent(ctx.world, AvatarComponent, child.resourceId));
  if (!avatar) throw new Error("avatar not found for entity " + node.name);
  return avatar;
}
