import { hasComponent } from "bitecs";

import { findChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { AvatarComponent } from "./components";

export function getAvatar(ctx: GameState, eid: number) {
  const avatar = findChild(eid, (child) => hasComponent(ctx.world, AvatarComponent, child));
  if (!avatar) throw new Error("avatar not found for entity " + eid);
  return avatar;
}
