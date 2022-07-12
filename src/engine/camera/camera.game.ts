import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
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

  const cameraTripleBuffer = createObjectTripleBuffer(perspectiveCameraSchema, ctx.gameToMainTripleBufferFlags);

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

  const cameraTripleBuffer = createObjectTripleBuffer(orthographicCameraSchema, ctx.gameToMainTripleBufferFlags);

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
