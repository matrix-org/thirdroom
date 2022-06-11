import {
  Light,
  Line,
  LineLoop,
  LineSegments,
  Matrix4,
  Mesh,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Points,
  Quaternion,
  Scene,
  SkinnedMesh,
  Vector3,
} from "three";

import { SharedObjectView } from "../allocator/ObjectBufferView";
import { LocalCameraResource } from "../camera/camera.render";
import { clamp } from "../component/transform";
import { tickRate } from "../config.common";
import { LocalLightResource } from "../light/light.render";
import { LocalMesh } from "../mesh/mesh.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { RendererNodeTripleBuffer } from "./node.common";

type PrimitiveObject3D = Mesh | SkinnedMesh | Line | LineSegments | LineLoop | Points;

export interface LocalNode {
  scene: Scene;
  rendererSharedNode: RendererNodeTripleBuffer;
  mesh?: LocalMesh;
  meshPrimitiveObjects?: PrimitiveObject3D[];
  camera?: LocalCameraResource;
  cameraObject?: PerspectiveCamera | OrthographicCamera;
  light?: LocalLightResource;
  lightObject?: Light;
}

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();

export function updateTransformFromNode(
  ctx: RenderThreadState,
  nodeReadView: SharedObjectView<RendererNodeTripleBuffer>,
  object3D: Object3D
) {
  const frameRate = 1 / ctx.dt;
  const lerpAlpha = clamp(tickRate / frameRate, 0, 1);

  tempMatrix4.fromArray(nodeReadView.worldMatrix);
  tempMatrix4.decompose(tempPosition, tempQuaternion, tempScale);

  // TODO: Optimize static objects
  object3D.position.lerp(tempPosition, lerpAlpha);
  object3D.quaternion.slerp(tempQuaternion, lerpAlpha);
  object3D.scale.lerp(tempScale, lerpAlpha);
}
