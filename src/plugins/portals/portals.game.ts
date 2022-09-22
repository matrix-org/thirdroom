import { addComponent } from "bitecs";

import { GameState } from "../../engine/GameTypes";
import { InteractableType } from "../interaction/interaction.common";
import { addInteractableComponent } from "../interaction/interaction.game";
import { PortalProps } from "./portals.common";

export const PortalComponent = new Map<number, PortalProps>();

export const addPortalComponent = (ctx: GameState, eid: number, data: PortalProps) => {
  addInteractableComponent(ctx, eid, InteractableType.Portal);
  addComponent(ctx.world, PortalComponent, eid);
  PortalComponent.set(eid, data);
  return eid;
};
