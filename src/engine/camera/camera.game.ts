import { addEntity } from "bitecs";
import { mat4, vec3 } from "gl-matrix";
import { degToRad } from "three/src/math/MathUtils";

import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { addTransformComponent, Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { addRemoteNodeComponent, RemoteNodeComponent } from "../node/node.game";
import { RendererModule } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import {
  CameraType,
  orthographicCameraSchema,
  perspectiveCameraSchema,
  PerspectiveCameraResourceType,
  SharedPerspectiveCameraResource,
  OrthographicCameraResourceType,
  SharedOrthographicCameraResource,
  PerspectiveCameraTripleBuffer,
  OrthographicCameraTripleBuffer,
} from "./camera.common";

export type PerspectiveCameraBufferView = ObjectBufferView<typeof perspectiveCameraSchema, ArrayBuffer>;
export type OrthographicCameraBufferView = ObjectBufferView<typeof orthographicCameraSchema, ArrayBuffer>;

export interface RemotePerspectiveCamera {
  name: string;
  resourceId: ResourceId;
  type: CameraType.Perspective;
  cameraBufferView: PerspectiveCameraBufferView;
  cameraTripleBuffer: PerspectiveCameraTripleBuffer;
  get layers(): number;
  set layers(value: number);
  get aspectRatio(): number;
  set aspectRatio(value: number);
  get yfov(): number;
  set yfov(value: number);
  get zfar(): number;
  set zfar(value: number);
  get znear(): number;
  set znear(value: number);
}

export interface RemoteOrthographicCamera {
  name: string;
  resourceId: ResourceId;
  type: CameraType.Orthographic;
  cameraBufferView: OrthographicCameraBufferView;
  cameraTripleBuffer: OrthographicCameraTripleBuffer;
  get layers(): number;
  set layers(value: number);
  get xmag(): number;
  set xmag(value: number);
  get ymag(): number;
  set ymag(value: number);
  get zfar(): number;
  set zfar(value: number);
  get znear(): number;
  set znear(value: number);
}

export type RemoteCamera = RemotePerspectiveCamera | RemoteOrthographicCamera;

export interface PerspectiveCameraProps {
  name?: string;
  layers?: number;
  aspectRatio?: number;
  yfov: number;
  zfar?: number;
  znear: number;
}

const DEFAULT_PERSPECTIVE_CAMERA_NAME = "Perspective Camera";

export function createRemotePerspectiveCamera(ctx: GameState, props?: PerspectiveCameraProps): RemotePerspectiveCamera {
  const rendererModule = getModule(ctx, RendererModule);

  const cameraBufferView = createObjectBufferView(perspectiveCameraSchema, ArrayBuffer);

  cameraBufferView.layers[0] = props?.layers === undefined ? 1 : props.layers;
  cameraBufferView.zfar[0] = props?.zfar || 2000;
  cameraBufferView.znear[0] = props?.znear === undefined ? 0.1 : props.znear;
  cameraBufferView.aspectRatio[0] = props?.aspectRatio || 0; // 0 for automatic aspect ratio defined by canvas
  cameraBufferView.yfov[0] = props?.yfov === undefined ? 50 : props.yfov;
  cameraBufferView.projectionMatrixNeedsUpdate[0] = 1;

  const cameraTripleBuffer = createObjectTripleBuffer(perspectiveCameraSchema, ctx.gameToRenderTripleBufferFlags);

  const name = props?.name || DEFAULT_PERSPECTIVE_CAMERA_NAME;

  const resourceId = createResource<SharedPerspectiveCameraResource>(
    ctx,
    Thread.Render,
    PerspectiveCameraResourceType,
    {
      type: CameraType.Perspective,
      cameraTripleBuffer,
    },
    {
      name,
      dispose() {
        const index = rendererModule.perspectiveCameras.findIndex((camera) => camera.resourceId === resourceId);

        if (index !== -1) {
          rendererModule.perspectiveCameras.splice(index, 1);
        }
      },
    }
  );

  const remoteCamera: RemotePerspectiveCamera = {
    name,
    resourceId,
    cameraBufferView,
    cameraTripleBuffer,
    type: CameraType.Perspective,
    get layers(): number {
      return cameraBufferView.layers[0];
    },
    set layers(value: number) {
      cameraBufferView.layers[0] = value;
    },
    get aspectRatio(): number {
      return cameraBufferView.aspectRatio[0];
    },
    set aspectRatio(value: number) {
      cameraBufferView.aspectRatio[0] = value;
      cameraBufferView.projectionMatrixNeedsUpdate[0] = 1;
    },
    get yfov(): number {
      return cameraBufferView.yfov[0];
    },
    set yfov(value: number) {
      cameraBufferView.yfov[0] = value;
      cameraBufferView.projectionMatrixNeedsUpdate[0] = 1;
    },
    get zfar(): number {
      return cameraBufferView.zfar[0];
    },
    set zfar(value: number) {
      cameraBufferView.zfar[0] = value;
      cameraBufferView.projectionMatrixNeedsUpdate[0] = 1;
    },
    get znear(): number {
      return cameraBufferView.znear[0];
    },
    set znear(value: number) {
      cameraBufferView.znear[0] = value;
      cameraBufferView.projectionMatrixNeedsUpdate[0] = 1;
    },
  };

  rendererModule.perspectiveCameras.push(remoteCamera);

  return remoteCamera;
}

export interface OrthographicCameraProps {
  name?: string;
  layers?: number;
  xmag: number;
  ymag: number;
  zfar: number;
  znear: number;
}

const DEFAULT_ORTHOGRAPHIC_CAMERA_NAME = "Orthographic Camera";

export function createRemoteOrthographicCamera(
  ctx: GameState,
  props: OrthographicCameraProps
): RemoteOrthographicCamera {
  const rendererModule = getModule(ctx, RendererModule);

  const cameraBufferView = createObjectBufferView(orthographicCameraSchema, ArrayBuffer);

  cameraBufferView.layers[0] = props.layers === undefined ? 1 : props.layers;
  cameraBufferView.zfar[0] = props.zfar;
  cameraBufferView.znear[0] = props.znear;
  cameraBufferView.xmag[0] = props.xmag;
  cameraBufferView.ymag[0] = props.ymag;

  const cameraTripleBuffer = createObjectTripleBuffer(orthographicCameraSchema, ctx.gameToRenderTripleBufferFlags);

  const name = props.name || DEFAULT_ORTHOGRAPHIC_CAMERA_NAME;

  const resourceId = createResource<SharedOrthographicCameraResource>(
    ctx,
    Thread.Render,
    OrthographicCameraResourceType,
    {
      type: CameraType.Orthographic,
      cameraTripleBuffer,
    },
    {
      name,
      dispose() {
        const index = rendererModule.orthographicCameras.findIndex((camera) => camera.resourceId === resourceId);

        if (index !== -1) {
          rendererModule.orthographicCameras.splice(index, 1);
        }
      },
    }
  );

  const remoteCamera: RemoteOrthographicCamera = {
    name,
    resourceId,
    cameraBufferView,
    cameraTripleBuffer,
    type: CameraType.Orthographic,
    get layers(): number {
      return cameraBufferView.layers[0];
    },
    set layers(value: number) {
      cameraBufferView.layers[0] = value;
    },
    get xmag(): number {
      return cameraBufferView.xmag[0];
    },
    set xmag(value: number) {
      cameraBufferView.xmag[0] = value;
      cameraBufferView.projectionMatrixNeedsUpdate[0] = 1;
    },
    get ymag(): number {
      return cameraBufferView.ymag[0];
    },
    set ymag(value: number) {
      cameraBufferView.ymag[0] = value;
      cameraBufferView.projectionMatrixNeedsUpdate[0] = 1;
    },
    get zfar(): number {
      return cameraBufferView.zfar[0];
    },
    set zfar(value: number) {
      cameraBufferView.zfar[0] = value;
      cameraBufferView.projectionMatrixNeedsUpdate[0] = 1;
    },
    get znear(): number {
      return cameraBufferView.znear[0];
    },
    set znear(value: number) {
      cameraBufferView.znear[0] = value;
      cameraBufferView.projectionMatrixNeedsUpdate[0] = 1;
    },
  };

  rendererModule.orthographicCameras.push(remoteCamera);

  return remoteCamera;
}

export function updateRemoteCameras(ctx: GameState) {
  const { perspectiveCameras, orthographicCameras } = getModule(ctx, RendererModule);

  for (let i = 0; i < perspectiveCameras.length; i++) {
    const perspectiveCamera = perspectiveCameras[i];
    commitToObjectTripleBuffer(perspectiveCamera.cameraTripleBuffer, perspectiveCamera.cameraBufferView);
    perspectiveCamera.cameraBufferView.projectionMatrixNeedsUpdate[0] = 0;
  }

  for (let i = 0; i < orthographicCameras.length; i++) {
    const orthographicCamera = perspectiveCameras[i];
    commitToObjectTripleBuffer(orthographicCamera.cameraTripleBuffer, orthographicCamera.cameraBufferView);
    orthographicCamera.cameraBufferView.projectionMatrixNeedsUpdate[0] = 0;
  }
}

export function createCamera(state: GameState, setActive = true): number {
  const eid = addEntity(state.world);
  addTransformComponent(state.world, eid);

  const remoteCamera = createRemotePerspectiveCamera(state, {
    yfov: 75,
    znear: 0.1,
  });

  addRemoteNodeComponent(state, eid, {
    camera: remoteCamera,
  });

  if (setActive) {
    state.activeCamera = eid;
  }

  return eid;
}

const _pm = mat4.create();
const _icm = mat4.create();
export function projectPerspective(ctx: GameState, cameraEid: number, v3: vec3) {
  const cameraNode = RemoteNodeComponent.get(cameraEid);
  const cameraMatrix = Transform.worldMatrix[cameraEid];
  if (cameraNode?.camera) {
    const projectionMatrix = calculateProjectionMatrix(ctx, cameraNode.camera as RemotePerspectiveCamera);
    const cameraMatrixWorldInverse = mat4.invert(_icm, cameraMatrix);
    const v = vec3.clone(v3);
    vec3.transformMat4(v, v3, cameraMatrixWorldInverse);
    vec3.transformMat4(v, v, projectionMatrix);
    return v;
  } else {
    throw new Error("no active camera found to project with");
  }
}

export function calculateProjectionMatrix(ctx: GameState, camera: RemotePerspectiveCamera) {
  const renderer = getModule(ctx, RendererModule);
  const { znear: near, zfar: far, yfov: fov } = camera;

  const zoom = 1;
  const aspect = renderer.canvasWidth / renderer.canvasHeight;

  const top = (near * Math.tan(degToRad(0.5 * fov))) / zoom;
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
