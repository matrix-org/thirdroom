import { addComponent, defineQuery, exitQuery, hasComponent, Not, removeComponent } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";

import { FlyControls } from "../../plugins/FlyCharacterController";
import { addXRRaycaster } from "../../plugins/interaction/XRInteractionSystem";
import { KinematicControls } from "../../plugins/KinematicCharacterController";
import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { addChild, removeChild, setFromLocalMatrix, updateMatrixWorld } from "../component/transform";
import { GameState, World } from "../GameTypes";
import { createNodeFromGLTFURI } from "../gltf/gltf.game";
import { XRMode } from "../renderer/renderer.common";
import { getXRMode, RendererModule } from "../renderer/renderer.game";
import { getModule, Thread } from "../module/module.common";
import { createPrefabEntity } from "../prefab/prefab.game";
import { addObjectToWorld, RemoteNode } from "../resource/RemoteResources";
import { getRemoteResource, tryGetRemoteResource } from "../resource/resource.game";
import { teleportEntity } from "../utils/teleportEntity";
import { ActionMap, ActionType, BindingType, ButtonActionState } from "./ActionMap";
import { InputMessageType, SharedXRInputSource, SetXRReferenceSpaceMessage } from "./input.common";
import { InputModule } from "./input.game";
import { XRInputHandedness } from "./WebXRInputProfiles";
import { Networked, Owned } from "../network/NetworkComponents";
import { broadcastReliable } from "../network/outbound.game";
import { createInformXRMode } from "../network/serialization.game";
import { NetworkModule } from "../network/network.game";
import { XRHeadComponent, XRControllerComponent } from "../../plugins/thirdroom/thirdroom.game";
import { AvatarComponent } from "../../plugins/avatars/components";

export interface XRAvatarRig {
  prevLeftAssetPath?: string;
  leftControllerEid?: number;
  leftRayEid?: number;
  leftNetworkedEid?: number;
  leftRayNetworkedEid?: number;

  prevRightAssetPath?: string;
  rightControllerEid?: number;
  rightRayEid?: number;
  rightNetworkedEid?: number;
  rightRayNetworkedEid?: number;

  cameraEid?: number;
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

const remoteXRControllerQuery = defineQuery([Networked, Not(Owned), XRControllerComponent]);
const remoteXRHeadQuery = defineQuery([Networked, Not(Owned), XRHeadComponent]);
const remoteAvatarQuery = defineQuery([Networked, Not(Owned), AvatarComponent]);

const _v = vec3.create();
const _q = quat.create();

export function WebXRAvatarRigSystem(ctx: GameState) {
  const rendererModule = getModule(ctx, RendererModule);
  const { xrInputSourcesByHand } = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);
  const ourXRMode = getXRMode(ctx);
  const sceneSupportsAR = ctx.worldResource.environment?.publicScene.supportsAR || false;
  const rigs = xrAvatarRigQuery(ctx.world);

  if (ourXRMode !== rendererModule.prevXRMode) {
    rendererModule.prevXRMode = ourXRMode;

    // inform other clients of our XRMode
    broadcastReliable(ctx, network, createInformXRMode(ctx, ourXRMode));
  }

  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const rigNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const xrRig = XRAvatarRig.get(eid);

    if (!xrRig) {
      continue;
    }

    updateXRCamera(ctx, rigNode, xrRig, xrInputSourcesByHand);
    updateXRController(ctx, xrInputSourcesByHand, rigNode, xrRig, "left");
    updateXRController(ctx, xrInputSourcesByHand, rigNode, xrRig, "right");

    if (ourXRMode === XRMode.ImmersiveAR && sceneSupportsAR) {
      if (!xrRig.arPrevCharController) {
        if (hasComponent(ctx.world, KinematicControls, eid)) {
          xrRig.arPrevCharController = "kinematic";
          removeComponent(ctx.world, KinematicControls, eid);
        }

        if (hasComponent(ctx.world, FlyControls, eid)) {
          xrRig.arPrevCharController = "fly";
          removeComponent(ctx.world, FlyControls, eid);
        }

        teleportEntity(rigNode, _v, _q);
      }
    } else if (xrRig.arPrevCharController) {
      if (xrRig.arPrevCharController === "kinematic") {
        addComponent(ctx.world, KinematicControls, eid);
      } else {
        addComponent(ctx.world, FlyControls, eid);
      }

      xrRig.arPrevCharController = undefined;
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

  // determine visibility of XR objects depending on XR modes of the clients who own those objects

  const remoteXRControllers = remoteXRControllerQuery(ctx.world);
  for (let i = 0; i < remoteXRControllers.length; i++) {
    const eid = remoteXRControllers[i];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const peerId = network.entityIdToPeerId.get(eid)!;
    const theirXRMode = network.peerIdToXRMode.get(peerId)!;

    // hands are hidden for AR participants
    node.visible = !(sceneSupportsAR && ourXRMode === XRMode.ImmersiveAR && theirXRMode === XRMode.ImmersiveAR);
  }

  const remoteXRHeads = remoteXRHeadQuery(ctx.world);
  for (let i = 0; i < remoteXRHeads.length; i++) {
    const eid = remoteXRHeads[i];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const peerId = network.entityIdToPeerId.get(eid)!;
    const theirXRMode = network.peerIdToXRMode.get(peerId)!;

    // heads are hidden for AR participants
    node.visible = !(sceneSupportsAR && ourXRMode === XRMode.ImmersiveAR && theirXRMode === XRMode.ImmersiveAR);
  }

  const remoteAvatars = remoteAvatarQuery(ctx.world);
  for (let i = 0; i < remoteAvatars.length; i++) {
    const eid = remoteAvatars[i];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const peerId = network.entityIdToPeerId.get(eid)!;
    const theirXRMode = network.peerIdToXRMode.get(peerId)!;

    const avatarEid = AvatarComponent.eid[node.eid];
    const avatar = tryGetRemoteResource<RemoteNode>(ctx, avatarEid);

    // regular avatar is hidden for XR participants
    avatar.visible = !(theirXRMode === XRMode.ImmersiveAR || theirXRMode === XRMode.ImmersiveVR);

    // re-scale if the remote avatar is visible and we are AR
    if (avatar.visible && ourXRMode === XRMode.ImmersiveAR) {
      node.scale.set([1, 1, 1]);
    }
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
        if (ctx.worldResource.environment?.publicScene.supportsAR && getXRMode(ctx) === XRMode.ImmersiveAR) {
          controllerNode.visible = false;
        } else {
          controllerNode.visible = true;
        }
      }
    }

    const controllerPoses = getReadObjectBufferView(inputSource.controllerPoses);

    if (!controllerNode) {
      // controller
      controllerNode = createNodeFromGLTFURI(ctx, assetPath);
      addChild(rigNode, controllerNode);

      // local ray
      const rayNode = createPrefabEntity(ctx, "xr-ray");
      addChild(rigNode, rayNode);
      addXRRaycaster(ctx, rayNode.eid, hand);

      // networked ray
      const networkedRayNode = createPrefabEntity(ctx, "xr-ray");
      addComponent(ctx.world, Owned, networkedRayNode.eid);
      addComponent(ctx.world, Networked, networkedRayNode.eid);
      addObjectToWorld(ctx, networkedRayNode);

      networkedRayNode.visible = false;

      // networked hand
      const networkedController = createPrefabEntity(ctx, `xr-hand-${hand}`);
      addComponent(ctx.world, Owned, networkedController.eid);
      addComponent(ctx.world, Networked, networkedController.eid);

      networkedController.visible = false;

      addObjectToWorld(ctx, networkedController);

      if (hand === XRInputHandedness.Left) {
        rig.leftControllerEid = controllerNode.eid;
        rig.prevLeftAssetPath = assetPath;
        ctx.worldResource.activeLeftControllerNode = controllerNode;

        rig.leftNetworkedEid = networkedController.eid;
        rig.leftRayEid = rayNode.eid;
        rig.leftRayNetworkedEid = networkedRayNode.eid;
      } else if (hand === XRInputHandedness.Right) {
        rig.rightControllerEid = controllerNode.eid;
        rig.prevRightAssetPath = assetPath;
        ctx.worldResource.activeRightControllerNode = controllerNode;

        rig.rightNetworkedEid = networkedController.eid;
        rig.rightRayEid = rayNode.eid;
        rig.rightRayNetworkedEid = networkedRayNode.eid;
      }
    }

    setFromLocalMatrix(controllerNode, controllerPoses.gripPose);

    // take controller node world matrices and copy to networked ents
    if (rig.leftNetworkedEid && hand === XRInputHandedness.Left) {
      const node = tryGetRemoteResource<RemoteNode>(ctx, rig.leftNetworkedEid);
      updateMatrixWorld(node);
      setFromLocalMatrix(node, controllerNode.worldMatrix);

      const ray = tryGetRemoteResource<RemoteNode>(ctx, rig.leftRayEid!);
      const networkedRay = tryGetRemoteResource<RemoteNode>(ctx, rig.leftRayNetworkedEid!);
      setFromLocalMatrix(networkedRay, ray.worldMatrix);
    }
    if (rig.rightNetworkedEid && hand === XRInputHandedness.Right) {
      const node = tryGetRemoteResource<RemoteNode>(ctx, rig.rightNetworkedEid);
      updateMatrixWorld(node);
      setFromLocalMatrix(node, controllerNode.worldMatrix);

      const ray = tryGetRemoteResource<RemoteNode>(ctx, rig.rightRayEid!);
      const networkedRay = tryGetRemoteResource<RemoteNode>(ctx, rig.rightRayNetworkedEid!);
      setFromLocalMatrix(networkedRay, ray.worldMatrix);
    }
  } else if (eid) {
    const controllerNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    if (ctx.worldResource.environment?.publicScene.supportsAR && getXRMode(ctx) === XRMode.ImmersiveAR) {
      controllerNode.visible = false;
    } else {
      controllerNode.visible = true;
    }
  }
}

const _m = mat4.create();

function updateXRCamera(
  ctx: GameState,
  rigNode: RemoteNode,
  xrRig: XRAvatarRig,
  xrInputSourcesByHand: Map<XRHandedness, SharedXRInputSource>
) {
  const inputSource = xrInputSourcesByHand.get("left");

  if (!inputSource) {
    return;
  }

  const cameraPoseTb = inputSource.cameraPose;
  const cameraPose = getReadObjectBufferView(cameraPoseTb);

  let cameraNode = getRemoteResource<RemoteNode>(ctx, xrRig.cameraEid || 0);

  if (!cameraNode || !xrRig.cameraEid) {
    cameraNode = createPrefabEntity(ctx, "xr-head");
    addComponent(ctx.world, Owned, cameraNode.eid);
    addComponent(ctx.world, Networked, cameraNode.eid);
    cameraNode.visible = false;
    addObjectToWorld(ctx, cameraNode);
    xrRig.cameraEid = cameraNode.eid;
  }

  const childWorldMatrix = _m;
  const childLocalMatrix = cameraPose.matrix;
  const parentWorldMatrix = rigNode.worldMatrix;

  mat4.multiply(childWorldMatrix, parentWorldMatrix, childLocalMatrix);

  setFromLocalMatrix(cameraNode, childWorldMatrix);
}
