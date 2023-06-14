import { GameContext } from "../GameTypes";
import { RemoteNode } from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { AvatarRef } from "./components";

export function getAvatar(ctx: GameContext, node: RemoteNode) {
  const avatarEid = AvatarRef.eid[node.eid];
  if (!avatarEid) throw new Error("avatar not found for entity " + node.name);
  const avatar = tryGetRemoteResource<RemoteNode>(ctx, avatarEid);
  return avatar;
}
