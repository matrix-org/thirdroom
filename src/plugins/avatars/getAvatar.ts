import { hasComponent } from "bitecs";

import { traverseRecursive } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { AvatarComponent } from "./components";

export function getAvatar(ctx: GameState, eid: number) {
  let avatar;
  traverseRecursive(eid, (e) => {
    if (hasComponent(ctx.world, AvatarComponent, e)) {
      avatar = e;
      return false;
    }
  });
  if (!avatar) throw new Error("avatar not found for entity " + eid);
  return avatar;
}
