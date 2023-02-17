import { GameState } from "../../engine/GameTypes";
import { RemoteNode } from "../../engine/resource/RemoteResources";
import { tryGetRemoteResource } from "../../engine/resource/resource.game";
import { AvatarComponent } from "./components";

export function getAvatar(ctx: GameState, node: RemoteNode) {
  const avatarEid = AvatarComponent.eid[node.eid];
  if (!avatarEid) throw new Error("avatar not found for entity " + node.name);
  const avatar = tryGetRemoteResource<RemoteNode>(ctx, avatarEid);
  return avatar;
}
