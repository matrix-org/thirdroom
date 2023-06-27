import { Matrix4, Object3D, Quaternion, Vector3 } from "three";

import { clamp } from "../common/math";
import { tickRate } from "../config.common";
import { RenderContext } from "./renderer.render";
import { RenderNode } from "./RenderResources";

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();

export function updateTransformFromNode(ctx: RenderContext, node: RenderNode, object3D: Object3D) {
  if (node.skipLerp) {
    setTransformFromNode(node, object3D);
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

export function setTransformFromNode(node: RenderNode, object3D: Object3D, inverseMatrix?: Matrix4) {
  tempMatrix4.fromArray(node.worldMatrix);

  if (inverseMatrix) tempMatrix4.premultiply(inverseMatrix);

  tempMatrix4.decompose(tempPosition, tempQuaternion, tempScale);

  object3D.position.copy(tempPosition);
  object3D.quaternion.copy(tempQuaternion);
  object3D.scale.copy(tempScale);

  object3D.visible = node.object3DVisible;
  object3D.layers.mask = node.layers;
}
