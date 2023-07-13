import { addComponent } from "bitecs";

import { GameState } from "../../engine/GameTypes";
import { getModule } from "../../engine/module/module.common";
import { PhysicsModule } from "../../engine/physics/physics.game";
import { RemoteNode } from "../../engine/resource/RemoteResources";
import { InteractableType } from "../../engine/resource/schema";
import { addInteractableComponent } from "../interaction/interaction.game";
import { ScreenshareProps } from "./screenshares.common";

export const ScreenshareComponent = new Map<number, ScreenshareProps>();

export const addScreenshareComponent = (ctx: GameState, node: RemoteNode, data: ScreenshareProps) => {
  const physics = getModule(ctx, PhysicsModule);
  addInteractableComponent(ctx, physics, node, InteractableType.Screenshare);
  addComponent(ctx.world, ScreenshareComponent, node.eid);
  ScreenshareComponent.set(node.eid, data);
  return node;
};
