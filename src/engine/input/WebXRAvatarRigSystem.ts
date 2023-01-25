import { addComponent, defineQuery, exitQuery } from "bitecs";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { addChild, removeChild, setFromLocalMatrix } from "../component/transform";
import { GameState, World } from "../GameTypes";
import { createNodeFromGLTFURI } from "../gltf/gltf.game";
import { getModule } from "../module/module.common";
import { RemoteNode } from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { SharedXRInputSource } from "./input.common";
import { InputModule } from "./input.game";

export interface XRAvatarRig {
  leftControllerEid?: number;
  prevLeftAssetPath?: string;
  rightControllerEid?: number;
  prevRightAssetPath?: string;
}

export const XRAvatarRig: Map<number, XRAvatarRig> = new Map();

export function addXRAvatarRig(world: World, eid: number) {
  addComponent(world, XRAvatarRig, eid);
  XRAvatarRig.set(eid, { leftControllerEid: undefined, rightControllerEid: undefined });
}

const xrAvatarRigQuery = defineQuery([XRAvatarRig]);
const xrAvatarRigExitQuery = exitQuery(xrAvatarRigQuery);

export function WebXRAvatarRigSystem(ctx: GameState) {
  const { xrInputSourcesByHand } = getModule(ctx, InputModule);
  const rigs = xrAvatarRigQuery(ctx.world);

  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const rigNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const rig = XRAvatarRig.get(eid);

    if (!rig) {
      continue;
    }

    updateXRController(ctx, xrInputSourcesByHand, rigNode, rig, "left");
    updateXRController(ctx, xrInputSourcesByHand, rigNode, rig, "right");
  }

  const exited = xrAvatarRigExitQuery(ctx.world);

  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    const rig = XRAvatarRig.get(eid);

    if (!rig) {
      continue;
    }

    const worldResource = ctx.worldResource;

    if (rig.leftControllerEid) {
      worldResource.activeLeftControllerNode = undefined;
    }

    if (rig.rightControllerEid) {
      worldResource.activeRightControllerNode = undefined;
    }

    XRAvatarRig.delete(eid);
  }
}

function updateXRController(
  ctx: GameState,
  xrInputSourcesByHand: Map<XRHandedness, SharedXRInputSource>,
  rigNode: RemoteNode,
  rig: XRAvatarRig,
  hand: XRHandedness
) {
  const inputSource = xrInputSourcesByHand.get(hand);

  const eid = hand === "left" ? rig.leftControllerEid : rig.rightControllerEid;

  if (inputSource) {
    const assetPath = inputSource.layout.assetPath;
    let controllerNode: RemoteNode | undefined;

    if (eid) {
      controllerNode = tryGetRemoteResource<RemoteNode>(ctx, eid);

      if (hand === "left" && rig.prevLeftAssetPath !== assetPath) {
        removeChild(rigNode, controllerNode);
        controllerNode = undefined;
      } else if (hand === "right" && rig.prevRightAssetPath !== assetPath) {
        removeChild(rigNode, controllerNode);
        controllerNode = undefined;
      } else {
        controllerNode.visible = true;
      }
    }

    if (!controllerNode) {
      controllerNode = createNodeFromGLTFURI(ctx, assetPath);
      addChild(rigNode, controllerNode);

      const worldResource = ctx.worldResource;

      if (hand === "left") {
        rig.leftControllerEid = controllerNode.eid;
        rig.prevLeftAssetPath = assetPath;
        worldResource.activeLeftControllerNode = controllerNode;
      } else if (hand === "right") {
        rig.rightControllerEid = controllerNode.eid;
        rig.prevRightAssetPath = assetPath;
        worldResource.activeRightControllerNode = controllerNode;
      }
    }

    const controllerPoses = getReadObjectBufferView(inputSource.controllerPoses);
    setFromLocalMatrix(controllerNode, controllerPoses.gripPose);
  } else if (eid) {
    const controllerNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    controllerNode.visible = false;
  }
}
