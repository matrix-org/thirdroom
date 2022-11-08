import { addEntity } from "bitecs";
import { mat4, vec3, glMatrix } from "gl-matrix";

import { addTransformComponent, Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { addRemoteNodeComponent, RemoteNodeComponent } from "../node/node.game";
import { RendererModule } from "../renderer/renderer.game";
import { getRemoteResources } from "../resource/resource.game";
import { CameraResource, CameraType, RemoteCamera } from "../resource/schema";

export function RemoteCameraSystem(ctx: GameState) {
  const cameras = getRemoteResources(ctx, CameraResource);

  for (let i = 0; i < cameras.length; i++) {
    const camera = cameras[i];
    camera.projectionMatrixNeedsUpdate = false;
  }
}

export function createRemotePerspectiveCamera(ctx: GameState) {
  return ctx.resourceManager.createResource(CameraResource, {
    type: CameraType.Perspective,
    yfov: glMatrix.toRadian(75),
    znear: 0.1,
    zfar: 2000,
  });
}

export function createCamera(ctx: GameState, setActive = true): number {
  const eid = addEntity(ctx.world);
  addTransformComponent(ctx.world, eid);

  addRemoteNodeComponent(ctx, eid, {
    camera: createRemotePerspectiveCamera(ctx),
  });

  if (setActive) {
    ctx.activeCamera = eid;
  }

  return eid;
}

const _pm = mat4.create();
const _icm = mat4.create();
export function projectPerspective(ctx: GameState, cameraEid: number, v3: vec3) {
  const cameraNode = RemoteNodeComponent.get(cameraEid);
  const cameraMatrix = Transform.worldMatrix[cameraEid];
  if (cameraNode?.camera) {
    const projectionMatrix = calculateProjectionMatrix(ctx, cameraNode.camera as RemoteCamera);
    const cameraMatrixWorldInverse = mat4.invert(_icm, cameraMatrix);
    const v = vec3.clone(v3);
    vec3.transformMat4(v, v3, cameraMatrixWorldInverse);
    vec3.transformMat4(v, v, projectionMatrix);
    return v;
  } else {
    throw new Error("no active camera found to project with");
  }
}

export function calculateProjectionMatrix(ctx: GameState, camera: RemoteCamera) {
  const renderer = getModule(ctx, RendererModule);
  const { znear: near, zfar: far, yfov: fov } = camera;

  const zoom = 1;
  const aspect = renderer.canvasWidth / renderer.canvasHeight;

  const top = (near * Math.tan(0.5 * fov)) / zoom;
  const height = 2 * top;
  const width = aspect * height;
  const left = -0.5 * width;

  return makePerspective(_pm, left, left + width, top, top - height, near, far);
}

function makePerspective(
  matrix: mat4,
  left: number,
  right: number,
  top: number,
  bottom: number,
  near: number,
  far: number
) {
  const m = matrix;
  const x = (2 * near) / (right - left);
  const y = (2 * near) / (top - bottom);

  const a = (right + left) / (right - left);
  const b = (top + bottom) / (top - bottom);
  const c = -(far + near) / (far - near);
  const d = (-2 * far * near) / (far - near);

  m[0] = x;
  m[4] = 0;
  m[8] = a;
  m[12] = 0;
  m[1] = 0;
  m[5] = y;
  m[9] = b;
  m[13] = 0;
  m[2] = 0;
  m[6] = 0;
  m[10] = c;
  m[14] = d;
  m[3] = 0;
  m[7] = 0;
  m[11] = -1;
  m[15] = 0;

  return m;
}
