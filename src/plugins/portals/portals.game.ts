import { addComponent } from "bitecs";

import { GameState } from "../../engine/GameTypes";
import { PhysicsModuleState } from "../../engine/physics/physics.game";
import { RemoteNode } from "../../engine/resource/resource.game";
import { InteractableType } from "../../engine/resource/schema";
import { addInteractableComponent } from "../interaction/interaction.game";
import { PortalProps } from "./portals.common";

export const PortalComponent = new Map<number, PortalProps>();

export const addPortalComponent = (
  ctx: GameState,
  physics: PhysicsModuleState,
  node: RemoteNode,
  data: PortalProps
) => {
  addInteractableComponent(ctx, physics, node, InteractableType.Portal);
  addComponent(ctx.world, PortalComponent, node.eid);
  PortalComponent.set(node.eid, data);
  return node;
};
