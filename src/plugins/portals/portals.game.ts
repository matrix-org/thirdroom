import { addComponent } from "bitecs";

import { GameState } from "../../engine/GameTypes";
import { PhysicsModuleState } from "../../engine/physics/physics.game";
import { InteractableType } from "../../engine/resource/schema";
import { addInteractableComponent } from "../interaction/interaction.game";
import { PortalProps } from "./portals.common";

export const PortalComponent = new Map<number, PortalProps>();

export const addPortalComponent = (ctx: GameState, physics: PhysicsModuleState, eid: number, data: PortalProps) => {
  addInteractableComponent(ctx, physics, eid, InteractableType.Portal);
  addComponent(ctx.world, PortalComponent, eid);
  PortalComponent.set(eid, data);
  return eid;
};
