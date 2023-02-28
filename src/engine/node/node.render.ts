import { mat4 } from "gl-matrix";
import { Matrix4, Object3D, Quaternion, Vector3 } from "three";

import { updateNodeCamera } from "../camera/camera.render";
import { clamp } from "../component/math";
import { tickRate } from "../config.common";
import { RenderInputModule } from "../input/input.render";
import { updateNodeLight } from "../light/light.render";
import { updateNodeMesh } from "../mesh/mesh.render";
import { updateNodeReflectionProbe } from "../reflection-probe/reflection-probe.render";
import { RendererModuleState, RenderThreadState } from "../renderer/renderer.render";
import { getLocalResources, RenderNode } from "../resource/resource.render";
import { updateNodeTilesRenderer } from "../tiles-renderer/tiles-renderer.render";

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();

export function updateTransformFromNode(ctx: RenderThreadState, node: RenderNode, object3D: Object3D) {
  if (node.skipLerp) {
    setTransformFromNode(ctx, node, object3D);
    return;
  }

  const frameRate = 1 / ctx.dt;
  const lerpAlpha = clamp(tickRate / frameRate, 0, 1);

  tempMatrix4.fromArray(node.worldMatrix);
  tempMatrix4.decompose(tempPosition, tempQuaternion, tempScale);

  // TODO: Optimize static objects
  object3D.position.lerp(tempPosition, lerpAlpha);
  object3D.quaternion.slerp(tempQuaternion, lerpAlpha);
  object3D.scale.lerp(tempScale, lerpAlpha);

  object3D.visible = node.object3DVisible;
  object3D.layers.mask = node.layers;
}

export function setTransformFromNode(
  ctx: RenderThreadState,
  node: RenderNode,
  object3D: Object3D,
  inverseMatrix?: Matrix4
) {
  tempMatrix4.fromArray(node.worldMatrix);

  if (inverseMatrix) tempMatrix4.premultiply(inverseMatrix);

  tempMatrix4.decompose(tempPosition, tempQuaternion, tempScale);

  object3D.position.copy(tempPosition);
  object3D.quaternion.copy(tempQuaternion);
  object3D.scale.copy(tempScale);

  object3D.visible = node.object3DVisible;
  object3D.layers.mask = node.layers;
}

export function updateLocalNodeResources(
  ctx: RenderThreadState,
  rendererModule: RendererModuleState,
  forceUpdate: boolean
) {
  const nodes = getLocalResources(ctx, RenderNode);

  const scene = rendererModule.scene;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (forceUpdate) {
      node.needsUpdate = true;
    }

    const needsUpdate = node.needsUpdate;

    if (!needsUpdate) {
      continue;
    }

    updateNodeCamera(ctx, scene, node);
    updateNodeLight(ctx, scene, node);
    updateNodeReflectionProbe(ctx, scene, node);
    updateNodeMesh(ctx, node);
    updateNodeTilesRenderer(ctx, scene, node);

    node.needsUpdate = node.isStatic ? false : needsUpdate;
  }
}

export function updateNodesFromXRPoses(
  ctx: RenderThreadState,
  rendererModule: RendererModuleState,
  inputModule: RenderInputModule
) {
  const { activeAvatarNode, activeCameraNode, activeLeftControllerNode, activeRightControllerNode } = ctx.worldResource;
  const { renderer, xrAvatarRoot, scene } = rendererModule;
  const isPresenting = renderer.xr.isPresenting;
  const { cameraPose, leftControllerPose, rightControllerPose } = inputModule;

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
