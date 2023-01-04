import { Matrix4, Object3D, Quaternion, Vector3 } from "three";

import { updateNodeCamera } from "../camera/camera.render";
import { clamp } from "../component/transform";
import { tickRate } from "../config.common";
import { updateNodeLight } from "../light/light.render";
import { updateNodeMesh } from "../mesh/mesh.render";
import { updateNodeReflectionProbe } from "../reflection-probe/reflection-probe.render";
import { RendererModuleState, RenderThreadState } from "../renderer/renderer.render";
import { getLocalResources, RenderNode, RenderScene } from "../resource/resource.render";
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
  activeSceneResource: RenderScene | undefined,
  activeCameraNode: RenderNode | undefined
) {
  const nodes = getLocalResources(ctx, RenderNode);

  if (!activeSceneResource) {
    return;
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const scene = activeSceneResource.sceneObject;
    updateNodeCamera(ctx, scene, node);
    updateNodeLight(ctx, scene, node);
    updateNodeReflectionProbe(ctx, scene, node);
    updateNodeMesh(ctx, activeSceneResource, node);
    updateNodeTilesRenderer(ctx, scene, activeCameraNode, node);
  }
}
