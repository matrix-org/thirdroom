import { addComponent, defineQuery } from "bitecs";

import { GameState, World } from "../GameTypes";
import { tryGetRemoteResource } from "../resource/resource.game";
import { SharedXRInputSource } from "./input.common";

export interface XRAvatarRig {
  local: boolean;
  leftControllerEid: number;
  rightControllerEid: number;
  leftControllerInputSource?: SharedXRInputSource;
  rightControllerInputSource?: SharedXRInputSource;
}

export const XRAvatarRig: Map<number, XRAvatarRig> = new Map();

export function addXRAvatarRig(world: World, eid: number, leftControllerEid: number, rightControllerEid: number) {
  addComponent(world, XRAvatarRig, eid);
  XRAvatarRig.set(eid, {
    local: false,
    leftControllerEid,
    rightControllerEid,
    leftControllerInputSource: undefined,
    rightControllerInputSource: undefined,
  });
}

export function setLocalXRAvatarRig(ctx: GameState, eid: number) {
  const rig = XRAvatarRig.get(eid);

  if (rig) {
    rig.local = true;

    const worldResource = ctx.worldResource;
    worldResource.activeLeftControllerNode = tryGetRemoteResource(ctx, rig.leftControllerEid);
    worldResource.activeRightControllerNode = tryGetRemoteResource(ctx, rig.rightControllerEid);
  }
}

export const xrAvatarRigQuery = defineQuery([XRAvatarRig]);
