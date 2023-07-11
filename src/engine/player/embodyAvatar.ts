import { removeComponent, addComponent } from "bitecs";

import { removeInteractableComponent } from "../../plugins/interaction/interaction.game";
import { GameContext } from "../GameTypes";
import { addXRAvatarRig } from "../input/WebXRAvatarRigSystem";
import { PhysicsModuleState } from "../physics/physics.game";
import { RemoteNode } from "../resource/RemoteResources";
import { getRemoteResource } from "../resource/resource.game";
import { AvatarRef } from "./components";
import { tryGetCamera } from "./getCamera";
import { NametagAnchor, getNametag } from "./nametags.game";
import { OurPlayer, Player } from "./Player";

export function embodyAvatar(ctx: GameContext, physics: PhysicsModuleState, node: RemoteNode) {
  // remove the nametag
  const nametag = getNametag(ctx, node);
  if (nametag) removeComponent(ctx.world, NametagAnchor, nametag.eid);

  // hide our avatar
  const avatarEid = AvatarRef.eid[node.eid];
  const avatar = getRemoteResource<RemoteNode>(ctx, avatarEid);
  if (avatar) avatar.visible = false;

  // mark entity as our player entity
  addComponent(ctx.world, OurPlayer, node.eid);
  addComponent(ctx.world, Player, node.eid);

  // disable the collision group so we are unable to focus our own rigidbody
  removeInteractableComponent(ctx, physics, node);

  // set the active camera
  ctx.worldResource.activeCameraNode = tryGetCamera(ctx, node);
  ctx.worldResource.activeAvatarNode = node;

  addXRAvatarRig(ctx.world, node.eid);
}
