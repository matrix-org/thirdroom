import { addComponent, defineQuery, exitQuery } from "bitecs";

import { GRAB_DISTANCE } from "../../plugins/interaction/interaction.game";
import { addXRRaycaster } from "../../plugins/interaction/XRInteractionSystem";
import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { addChild, removeChild, setFromLocalMatrix } from "../component/transform";
import { GameState, World } from "../GameTypes";
import { createNodeFromGLTFURI } from "../gltf/gltf.game";
import { createLineMesh } from "../mesh/mesh.game";
import { getModule } from "../module/module.common";
import { createRemoteObject, RemoteMaterial, RemoteNode } from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { MaterialAlphaMode, MaterialType } from "../resource/schema";
import { SharedXRInputSource } from "./input.common";
import { InputModule } from "./input.game";

export interface XRAvatarRig {
  leftControllerEid?: number;
  leftRayEid?: number;
  prevLeftAssetPath?: string;
  rightControllerEid?: number;
  rightRayEid?: number;
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

function createRay(ctx: GameState, color = [0, 0.3, 1, 0.3], length = GRAB_DISTANCE) {
  const rayMaterial = new RemoteMaterial(ctx.resourceManager, {
    name: "Ray Material",
    type: MaterialType.Standard,
    baseColorFactor: color,
    emissiveFactor: [0.7, 0.7, 0.7],
    metallicFactor: 0,
    roughnessFactor: 0,
    alphaMode: MaterialAlphaMode.BLEND,
  });
  const mesh = createLineMesh(ctx, length, 0.004, rayMaterial);
  const node = new RemoteNode(ctx.resourceManager, {
    mesh,
  });
  node.position[2] = 0.1;
  const obj = createRemoteObject(ctx, node);
  return obj;
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

    const controllerPoses = getReadObjectBufferView(inputSource.controllerPoses);

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

      const rayNode = createRay(ctx);
      // const rayNode2 = createRay(ctx, [0, 1, 0, 0.5]);
      // addChild(rayNode, rayNode2);
      // // rayNode2.visible = false;

      rayNode.name = `${hand}Ray`;
      addChild(rigNode, rayNode);
      addXRRaycaster(ctx, rayNode.eid, hand);

      if (hand === "left") rig.leftRayEid = rayNode.eid;
      if (hand === "right") rig.rightRayEid = rayNode.eid;
    }

    setFromLocalMatrix(controllerNode, controllerPoses.gripPose);
  } else if (eid) {
    const controllerNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    controllerNode.visible = false;
  }
}
