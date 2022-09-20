import { addComponent, addEntity } from "bitecs";

import { World } from "../../engine/GameTypes";
import { PortalProps } from "./portals.common";

export const PortalComponent = new Map<number, PortalProps>();

export const createPortal = (world: World, data: PortalProps) => {
  const eid = addEntity(world);
  return addPortalComponent(world, eid, data);
};

export const addPortalComponent = (world: World, eid: number, data: PortalProps) => {
  addComponent(world, PortalComponent, eid);
  PortalComponent.set(eid, data);
  return eid;
};

export const getPortalComponent = (world: World, eid: number): PortalProps => {
  const data = PortalComponent.get(eid);
  if (!data) throw new Error("no portal found on entity: " + eid);
  return data;
};
