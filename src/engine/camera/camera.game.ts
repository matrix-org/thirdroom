import { addComponent, defineComponent, removeComponent } from "bitecs";

import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import {
  CameraType,
  orthographicCameraSchema,
  perspectiveCameraSchema,
  PerspectiveCameraResourceProps,
  PerspectiveCameraResourceType,
  SharedPerspectiveCameraResource,
  OrthographicCameraResourceProps,
  OrthographicCameraResourceType,
  SharedOrthographicCameraResource,
  SharedPerspectiveCamera,
  SharedOrthographicCamera,
} from "./camera.common";

export interface RemotePerspectiveCamera {
  resourceId: ResourceId;
  type: CameraType.Perspective;
  sharedCamera: SharedPerspectiveCamera;
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
  resourceId: ResourceId;
  type: CameraType.Orthographic;
  sharedCamera: SharedOrthographicCamera;
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

export interface CameraModuleState {
  perspectiveCameras: RemotePerspectiveCamera[];
  orthographicCameras: RemoteOrthographicCamera[];
}

export const CameraModule = defineModule<GameState, CameraModuleState>({
  name: "camera",
  create() {
    return {
      perspectiveCameras: [],
      orthographicCameras: [],
    };
  },
  init() {},
});

export function CameraUpdateSystem(ctx: GameState) {
  const { perspectiveCameras, orthographicCameras } = getModule(ctx, CameraModule);

  for (let i = 0; i < perspectiveCameras.length; i++) {
    const perspectiveCamera = perspectiveCameras[i];
    commitToTripleBufferView(perspectiveCamera.sharedCamera);
    perspectiveCamera.sharedCamera.projectionMatrixNeedsUpdate[0] = 0;
    perspectiveCamera.sharedCamera.needsUpdate[0] = 0;
  }

  for (let i = 0; i < orthographicCameras.length; i++) {
    const orthographicCamera = perspectiveCameras[i];
    commitToTripleBufferView(orthographicCamera.sharedCamera);
    orthographicCamera.sharedCamera.projectionMatrixNeedsUpdate[0] = 0;
    orthographicCamera.sharedCamera.needsUpdate[0] = 0;
  }
}

export function createRemotePerspectiveCamera(
  ctx: GameState,
  props: PerspectiveCameraResourceProps
): RemotePerspectiveCamera {
  const cameraModule = getModule(ctx, CameraModule);

  const camera = createObjectBufferView(perspectiveCameraSchema, ArrayBuffer);

  const initialProps: Required<PerspectiveCameraResourceProps> = {
    layers: props.layers === undefined ? 1 : props.layers,
    zfar: props.zfar || 2000,
    znear: props.znear,
    aspectRatio: props.aspectRatio || 0, // 0 for automatic aspect ratio defined by canvas
    yfov: props.yfov,
  };

  camera.layers[0] = initialProps.layers;
  camera.zfar[0] = initialProps.zfar;
  camera.znear[0] = initialProps.znear;
  camera.aspectRatio[0] = initialProps.aspectRatio;
  camera.yfov[0] = initialProps.yfov;
  camera.projectionMatrixNeedsUpdate[0] = 1;

  const sharedCamera = createTripleBufferBackedObjectBufferView(
    perspectiveCameraSchema,
    camera,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedPerspectiveCameraResource>(
    ctx,
    Thread.Render,
    PerspectiveCameraResourceType,
    {
      type: CameraType.Perspective,
      initialProps,
      sharedCamera,
    }
  );

  const remoteCamera: RemotePerspectiveCamera = {
    resourceId,
    sharedCamera,
    type: CameraType.Perspective,
    get layers(): number {
      return camera.layers[0];
    },
    set layers(value: number) {
      camera.layers[0] = value;
      camera.needsUpdate[0] = 1;
    },
    get aspectRatio(): number {
      return camera.aspectRatio[0];
    },
    set aspectRatio(value: number) {
      camera.aspectRatio[0] = value;
      camera.needsUpdate[0] = 1;
      camera.projectionMatrixNeedsUpdate[0] = 1;
    },
    get yfov(): number {
      return camera.yfov[0];
    },
    set yfov(value: number) {
      camera.yfov[0] = value;
      camera.needsUpdate[0] = 1;
      camera.projectionMatrixNeedsUpdate[0] = 1;
    },
    get zfar(): number {
      return camera.zfar[0];
    },
    set zfar(value: number) {
      camera.zfar[0] = value;
      camera.needsUpdate[0] = 1;
      camera.projectionMatrixNeedsUpdate[0] = 1;
    },
    get znear(): number {
      return camera.znear[0];
    },
    set znear(value: number) {
      camera.znear[0] = value;
      camera.needsUpdate[0] = 1;
      camera.projectionMatrixNeedsUpdate[0] = 1;
    },
  };

  cameraModule.perspectiveCameras.push(remoteCamera);

  return remoteCamera;
}

export function addOrthographicCameraResource(
  ctx: GameState,
  eid: number,
  props: OrthographicCameraResourceProps
): RemoteOrthographicCamera {
  const cameraModule = getModule(ctx, CameraModule);

  const camera = createObjectBufferView(orthographicCameraSchema, ArrayBuffer);

  const initialProps: Required<OrthographicCameraResourceProps> = {
    layers: props.layers === undefined ? 1 : props.layers,
    zfar: props.zfar,
    znear: props.znear,
    xmag: props.xmag,
    ymag: props.ymag,
  };

  camera.layers[0] = initialProps.layers;
  camera.zfar[0] = initialProps.zfar;
  camera.znear[0] = initialProps.znear;
  camera.xmag[0] = initialProps.xmag;
  camera.ymag[0] = initialProps.ymag;

  const sharedCamera = createTripleBufferBackedObjectBufferView(
    orthographicCameraSchema,
    camera,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedOrthographicCameraResource>(
    ctx,
    Thread.Render,
    OrthographicCameraResourceType,
    {
      type: CameraType.Orthographic,
      initialProps,
      sharedCamera,
    }
  );

  const remoteCamera: RemoteOrthographicCamera = {
    resourceId,
    sharedCamera,
    type: CameraType.Orthographic,
    get layers(): number {
      return camera.layers[0];
    },
    set layers(value: number) {
      camera.layers[0] = value;
      camera.needsUpdate[0] = 1;
    },
    get xmag(): number {
      return camera.xmag[0];
    },
    set xmag(value: number) {
      camera.xmag[0] = value;
      camera.needsUpdate[0] = 1;
      camera.projectionMatrixNeedsUpdate[0] = 1;
    },
    get ymag(): number {
      return camera.ymag[0];
    },
    set ymag(value: number) {
      camera.ymag[0] = value;
      camera.needsUpdate[0] = 1;
      camera.projectionMatrixNeedsUpdate[0] = 1;
    },
    get zfar(): number {
      return camera.zfar[0];
    },
    set zfar(value: number) {
      camera.zfar[0] = value;
      camera.needsUpdate[0] = 1;
      camera.projectionMatrixNeedsUpdate[0] = 1;
    },
    get znear(): number {
      return camera.znear[0];
    },
    set znear(value: number) {
      camera.znear[0] = value;
      camera.needsUpdate[0] = 1;
      camera.projectionMatrixNeedsUpdate[0] = 1;
    },
  };

  cameraModule.orthographicCameras.push(remoteCamera);

  return remoteCamera;
}

export const RemoteCameraComponent = defineComponent<Map<number, RemoteCamera>>(new Map());

export function addRemoteCameraComponent(ctx: GameState, eid: number, camera: RemoteCamera) {
  addComponent(ctx.world, RemoteCameraComponent, eid);
  RemoteCameraComponent.set(eid, camera);
}

export function removeRemoteCameraComponent(ctx: GameState, eid: number) {
  removeComponent(ctx.world, RemoteCameraComponent, eid);
  RemoteCameraComponent.delete(eid);
}
