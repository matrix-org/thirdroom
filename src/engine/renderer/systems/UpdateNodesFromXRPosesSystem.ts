import { mat4 } from "gl-matrix";
import { Matrix4, Object3D } from "three";

import { getModule } from "../../module/module.common";
import { RenderNode } from "../RenderResources";
import { updateTransformFromNode } from "../node";
import { RendererModule, RenderContext } from "../renderer.render";

export function UpdateNodesFromXRPosesSystem(ctx: RenderContext) {
  const { activeAvatarNode, activeCameraNode, activeLeftControllerNode, activeRightControllerNode } = ctx.worldResource;
  const { renderer, xrAvatarRoot, scene } = getModule(ctx, RendererModule);
  const isPresenting = renderer.xr.isPresenting;
  const { cameraPose, leftControllerPose, rightControllerPose } = getModule(ctx, RendererModule);

  if (ctx.singleConsumerThreadSharedState) {
    ctx.singleConsumerThreadSharedState.useXRViewerWorldMatrix = false;
  }

  if (isPresenting) {
    if (!activeAvatarNode) {
      return;
    }

    const avatarWorldMatrix = activeAvatarNode.worldMatrix;

    if (activeCameraNode) {
      if (activeCameraNode.cameraObject) {
        if (activeCameraNode.cameraObject.parent !== xrAvatarRoot) {
          xrAvatarRoot.add(activeCameraNode.cameraObject);
        }
      }

      updateTransformFromNode(ctx, activeAvatarNode, xrAvatarRoot);

      if (cameraPose) {
        updateTransformsFromXRPose(activeCameraNode, cameraPose, avatarWorldMatrix);

        if (ctx.singleConsumerThreadSharedState) {
          ctx.singleConsumerThreadSharedState.useXRViewerWorldMatrix = true;
          mat4.multiply(
            ctx.singleConsumerThreadSharedState.xrViewerWorldMatrix,
            avatarWorldMatrix,
            cameraPose.transform.matrix
          );
        }
      }
    }

    if (activeLeftControllerNode && leftControllerPose) {
      updateTransformsFromXRPose(activeLeftControllerNode, leftControllerPose, avatarWorldMatrix);
    }

    if (activeRightControllerNode && rightControllerPose) {
      updateTransformsFromXRPose(activeRightControllerNode, rightControllerPose, avatarWorldMatrix);
    }
  } else {
    if (activeCameraNode) {
      const cameraObject = activeCameraNode.cameraObject;

      if (cameraObject && cameraObject.parent !== scene) {
        scene.add(cameraObject);
      }
    }
  }
}

const _avatarRootMatrix = new Matrix4();
const _poseMatrix = new Matrix4();

function updateTransformsFromXRPose(node: RenderNode, pose: XRPose, avatarRootMatrix: Float32Array) {
  _avatarRootMatrix.fromArray(avatarRootMatrix);
  _poseMatrix.fromArray(pose.transform.matrix);

  const controllerWorldMatrix = _avatarRootMatrix.multiply(_poseMatrix);

  setObject3DWorldMatrices(node, controllerWorldMatrix);

  let curChild = node.firstChild;

  while (curChild) {
    updateNodeObject3DMatrices(curChild, controllerWorldMatrix);
    curChild = curChild.nextSibling;
  }
}

function updateNodeObject3DMatrices(node: RenderNode, parentMatrix: Matrix4) {
  const worldMatrix = node.object3DWorldMatrix.fromArray(node.localMatrix).premultiply(parentMatrix);

  setObject3DWorldMatrices(node, worldMatrix);

  let curChild = node.firstChild;

  while (curChild) {
    updateNodeObject3DMatrices(curChild, worldMatrix);
    curChild = curChild.nextSibling;
  }
}

function setObject3DWorldMatrices(node: RenderNode, worldMatrix: Matrix4) {
  if (node.bone) {
    setWorldMatrix(node.bone, worldMatrix);
  }

  if (node.cameraObject) {
    setWorldMatrix(node.cameraObject, worldMatrix);
  }

  if (node.lightObject) {
    setWorldMatrix(node.lightObject, worldMatrix);
  }

  if (node.meshPrimitiveObjects) {
    for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
      const mesh = node.meshPrimitiveObjects[i];
      setWorldMatrix(mesh, worldMatrix);
    }
  }

  if (node.reflectionProbeObject) {
    setWorldMatrix(node.reflectionProbeObject, worldMatrix);
  }

  if (node.tilesRendererObject) {
    setWorldMatrix(node.tilesRendererObject.group, worldMatrix);
  }
}

function setWorldMatrix(obj: Object3D, worldMatrix: Matrix4) {
  obj.matrix.copy(worldMatrix);
  obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
}
