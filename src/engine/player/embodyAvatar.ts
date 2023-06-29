import { removeComponent, addComponent } from "bitecs";

import { removeInteractableComponent } from "../../plugins/interaction/interaction.game";
import { GameContext } from "../GameTypes";
import { GameInputModule } from "../input/input.game";
import { addXRAvatarRig } from "../input/WebXRAvatarRigSystem";
import { PhysicsModuleState } from "../physics/physics.game";
import { RemoteNode } from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { AvatarRef } from "./components";
import { getCamera } from "./getCamera";
import { getNametag, NametagAnchor } from "./nametags.game";
import { OurPlayer } from "./Player";

// TODO: move this to a plugin (along with InformPlayerNetworkId OR register another hook into InformPlayerNetworkId)
export function embodyAvatar(ctx: GameContext, physics: PhysicsModuleState, input: GameInputModule, node: RemoteNode) {
  // remove the nametag
  try {
    const nametag = getNametag(ctx, node);
    removeComponent(ctx.world, NametagAnchor, nametag.eid);
  } catch {}

  // hide our avatar
  try {
    const avatarEid = AvatarRef.eid[node.eid];
    const avatar = tryGetRemoteResource<RemoteNode>(ctx, avatarEid);
    avatar.visible = false;
  } catch {}

  // mark entity as our player entity
  addComponent(ctx.world, OurPlayer, node.eid);

  // disable the collision group so we are unable to focus our own rigidbody
  removeInteractableComponent(ctx, physics, node);

  // set the active camera & input controller to this entity's
  ctx.worldResource.activeCameraNode = getCamera(ctx, node);
  ctx.worldResource.activeAvatarNode = node;

  addXRAvatarRig(ctx.world, node.eid);
}
