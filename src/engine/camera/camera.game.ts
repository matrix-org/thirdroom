import { mat4, vec3, glMatrix } from "gl-matrix";
import { defineComponent, Types } from "bitecs";

import { GameState, RemoteResourceManager } from "../GameTypes";
import { getRemoteResources, tryGetRemoteResource } from "../resource/resource.game";
import { GameRendererModuleState } from "../renderer/renderer.game";
import { RemoteCamera, RemoteNode } from "../resource/RemoteResources";
import { CameraType } from "../resource/schema";

export function RemoteCameraSystem(ctx: GameState) {
  const cameras = getRemoteResources(ctx, RemoteCamera);

  for (let i = 0; i < cameras.length; i++) {
    const camera = cameras[i];
    camera.projectionMatrixNeedsUpdate = false;
  }
}

export function createRemotePerspectiveCamera(
  ctx: GameState,
  resourceManager: RemoteResourceManager = ctx.resourceManager
) {
  return new RemoteCamera(resourceManager, {
    type: CameraType.Perspective,
    yfov: glMatrix.toRadian(75),
    znear: 0.1,
    zfar: 2000,
  });
}

const _icm = mat4.create();
const _v = vec3.create();
export function projectPerspective(renderer: GameRendererModuleState, cameraNode: RemoteNode, v3: vec3) {
  if (!cameraNode.camera) {
    throw new Error("no active camera found to project with");
  }

  const cameraMatrix = cameraNode.worldMatrix;
  const projectionMatrix = calculateProjectionMatrix(renderer, cameraNode.camera as RemoteCamera);
  const cameraMatrixWorldInverse = mat4.invert(_icm, cameraMatrix);
  const v = vec3.copy(_v, v3);
  vec3.transformMat4(v, v3, cameraMatrixWorldInverse);
  vec3.transformMat4(v, v, projectionMatrix);
  return v;
}

export function unproject(renderer: GameRendererModuleState, cameraNode: RemoteNode, v3: vec3) {
  if (!cameraNode.camera) {
    throw new Error("no active camera found to unproject with");
  }

  const projectionMatrix = calculateProjectionMatrix(renderer, cameraNode.camera);
  const projectionMatrixInverse = mat4.invert(projectionMatrix, projectionMatrix);

  const v = vec3.copy(_v, v3);
  vec3.transformMat4(v, v3, projectionMatrixInverse);
  vec3.transformMat4(v, v, cameraNode.worldMatrix);

  return v;
}

const _pm = mat4.create();
export function calculateProjectionMatrix(renderer: GameRendererModuleState, camera: RemoteCamera) {
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

export const CameraRef = defineComponent({ eid: Types.eid });

/**
 * Obtains the last added camera on the provided entity if one exists, throws if not
 */
export function getCamera(ctx: GameState, root: RemoteNode): RemoteNode {
  const cameraEid = CameraRef.eid[root.eid];
  if (!cameraEid) throw new Error(`CameraRef not found on node "${root.name}"`);
  const camera = tryGetRemoteResource<RemoteNode>(ctx, cameraEid);
  return camera;
}
