import { addComponent, defineQuery, exitQuery, hasComponent, removeComponent } from "bitecs";
import { quat, vec3 } from "gl-matrix";

import { FlyControls } from "../../plugins/FlyCharacterController";
import { GRAB_DISTANCE } from "../../plugins/interaction/interaction.game";
import { addXRRaycaster } from "../../plugins/interaction/XRInteractionSystem";
import { KinematicControls } from "../../plugins/KinematicCharacterController";
import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { addChild, removeChild, setFromLocalMatrix } from "../component/transform";
import { GameState, World } from "../GameTypes";
import { createNodeFromGLTFURI } from "../gltf/gltf.game";
import { createLineMesh } from "../mesh/mesh.game";
import { getModule, Thread } from "../module/module.common";
import { XRMode } from "../renderer/renderer.common";
import { getXRMode } from "../renderer/renderer.game";
import { createRemoteObject, RemoteMaterial, RemoteNode } from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { MaterialAlphaMode, MaterialType } from "../resource/schema";
import { teleportEntity } from "../utils/teleportEntity";
import { ActionMap, ActionType, BindingType, ButtonActionState } from "./ActionMap";
import { InputMessageType, SharedXRInputSource, SetXRReferenceSpaceMessage } from "./input.common";
import { InputModule } from "./input.game";

export interface XRAvatarRig {
  leftControllerEid?: number;
  leftRayEid?: number;
  prevLeftAssetPath?: string;
  rightControllerEid?: number;
  rightRayEid?: number;
  prevRightAssetPath?: string;
  arPrevCharController?: "kinematic" | "fly";
}

export const XRAvatarRig: Map<number, XRAvatarRig> = new Map();

export function addXRAvatarRig(world: World, eid: number) {
  addComponent(world, XRAvatarRig, eid);
  XRAvatarRig.set(eid, {
    leftControllerEid: undefined,
    rightControllerEid: undefined,
  });
}

const xrAvatarRigQuery = defineQuery([XRAvatarRig]);
const xrAvatarRigExitQuery = exitQuery(xrAvatarRigQuery);

const _v = vec3.create();
const _q = quat.create();

export function WebXRAvatarRigSystem(ctx: GameState) {
  const { xrInputSourcesByHand } = getModule(ctx, InputModule);
  const xrMode = getXRMode(ctx);
  const rigs = xrAvatarRigQuery(ctx.world);

  const sceneSupportsAR = ctx.worldResource.environment?.publicScene.supportsAR || false;

  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const rigNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const rig = XRAvatarRig.get(eid);

    if (!rig) {
      continue;
    }

    updateXRController(ctx, xrInputSourcesByHand, rigNode, rig, "left");
    updateXRController(ctx, xrInputSourcesByHand, rigNode, rig, "right");

    if (xrMode === XRMode.ImmersiveAR && sceneSupportsAR) {
      if (!rig.arPrevCharController) {
        if (hasComponent(ctx.world, KinematicControls, eid)) {
          rig.arPrevCharController = "kinematic";
          removeComponent(ctx.world, KinematicControls, eid);
        }

        if (hasComponent(ctx.world, FlyControls, eid)) {
          rig.arPrevCharController = "fly";
          removeComponent(ctx.world, FlyControls, eid);
        }

        teleportEntity(rigNode, _v, _q);
      }
    } else if (rig.arPrevCharController) {
      if (rig.arPrevCharController === "kinematic") {
        addComponent(ctx.world, KinematicControls, eid);
      } else {
        addComponent(ctx.world, FlyControls, eid);
      }

      rig.arPrevCharController = undefined;
    }
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

const ARActions = {
  ResetReferenceSpaceLeft: "AR/reset-reference-space/left",
  ResetReferenceSpaceRight: "AR/reset-reference-space/right",
};

export const ARActionMap: ActionMap = {
  id: "ar",
  actionDefs: [
    {
      id: "reset-reference-space-left",
      path: ARActions.ResetReferenceSpaceLeft,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "XRInputSource/left/xr-standard-thumbstick/button",
        },
      ],
      // networked: true,
    },
    {
      id: "reset-reference-space-right",
      path: ARActions.ResetReferenceSpaceRight,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "XRInputSource/right/xr-standard-thumbstick/button",
        },
      ],
      // networked: true,
    },
  ],
};

export function SetWebXRReferenceSpaceSystem(ctx: GameState) {
  const { activeController } = getModule(ctx, InputModule);

  const xrMode = getXRMode(ctx);

  const sceneSupportsAR = ctx.worldResource.environment?.publicScene.supportsAR || false;

  if (xrMode === XRMode.ImmersiveAR && sceneSupportsAR) {
    const resetReferenceSpaceLeft = activeController.actionStates.get(
      ARActions.ResetReferenceSpaceLeft
    ) as ButtonActionState;

    const resetReferenceSpaceRight = activeController.actionStates.get(
      ARActions.ResetReferenceSpaceRight
    ) as ButtonActionState;

    let hand: XRHandedness | undefined;

    if (resetReferenceSpaceLeft?.pressed) {
      hand = "left";
    }

    if (resetReferenceSpaceRight?.pressed) {
      hand = "right";
    }

    if (hand) {
      ctx.sendMessage<SetXRReferenceSpaceMessage>(Thread.Render, {
        type: InputMessageType.SetXRReferenceSpace,
        hand,
      });
    }
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
