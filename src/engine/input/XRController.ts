import { addComponent, defineQuery } from "bitecs";

import { World } from "../GameTypes";
import { SharedXRInputSource } from "./input.common";

interface XRController {
  hand: XRHandedness;
  inputSource?: SharedXRInputSource;
}

export const XRController: Map<number, XRController> = new Map();

export function addXRController(world: World, eid: number, hand: XRHandedness) {
  addComponent(world, XRController, eid);
  XRController.set(eid, { hand, inputSource: undefined });
}

export const xrControllerQuery = defineQuery([XRController]);
