import { OrthographicCamera, PerspectiveCamera } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { defineModule, getModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { registerResourceLoader } from "../resource/resource.render";
import {
  CameraType,
  OrthographicCameraResourceType,
  PerspectiveCameraResourceType,
  SharedOrthographicCamera,
  SharedOrthographicCameraResource,
  SharedPerspectiveCamera,
  SharedPerspectiveCameraResource,
} from "./camera.common";

export interface LocalPerspectiveCameraResource {
  type: CameraType.Perspective;
  camera: PerspectiveCamera;
  sharedCamera: SharedPerspectiveCamera;
}

export interface LocalOrthographicCameraResource {
  type: CameraType.Orthographic;
  camera: OrthographicCamera;
  sharedCamera: SharedOrthographicCamera;
}

export type LocalCameraResource = LocalOrthographicCameraResource | LocalPerspectiveCameraResource;

export type CameraModuleState = {
  cameraResources: Map<number, LocalCameraResource>;
  perspectiveCameraResources: LocalPerspectiveCameraResource[];
  orthographicCameraResources: LocalOrthographicCameraResource[];
};

export const CameraModule = defineModule<RenderThreadState, CameraModuleState>({
  name: "camera",
  create() {
    return {
      cameraResources: new Map(),
      perspectiveCameraResources: [],
      orthographicCameraResources: [],
    };
  },
  init(ctx) {
    const disposables = [
      registerResourceLoader(ctx, PerspectiveCameraResourceType, onLoadPerspectiveCamera),
      registerResourceLoader(ctx, OrthographicCameraResourceType, onLoadOrthographicCamera),
    ];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadPerspectiveCamera(
  ctx: RenderThreadState,
  id: ResourceId,
  { eid, type, initialProps, sharedCamera }: SharedPerspectiveCameraResource
): Promise<PerspectiveCamera> {
  const cameraModule = getModule(ctx, CameraModule);

  const camera = new PerspectiveCamera(
    initialProps.yfov,
    initialProps.aspectRatio,
    initialProps.znear,
    initialProps.zfar
  );

  camera.layers.mask = initialProps.layers;

  const perspectiveCameraResource: LocalPerspectiveCameraResource = {
    type,
    camera,
    sharedCamera,
  };

  cameraModule.cameraResources.set(eid, perspectiveCameraResource);
  cameraModule.perspectiveCameraResources.push(perspectiveCameraResource);

  return camera;
}

async function onLoadOrthographicCamera(
  ctx: RenderThreadState,
  id: ResourceId,
  { eid, type, initialProps, sharedCamera }: SharedOrthographicCameraResource
): Promise<OrthographicCamera> {
  const cameraModule = getModule(ctx, CameraModule);

  const camera = new OrthographicCamera(
    -initialProps.xmag,
    initialProps.xmag,
    initialProps.ymag,
    -initialProps.ymag,
    initialProps.znear,
    initialProps.zfar
  );

  camera.layers.mask = initialProps.layers;

  const orthographicCameraResource: LocalOrthographicCameraResource = {
    type,
    camera,
    sharedCamera,
  };

  cameraModule.cameraResources.set(eid, orthographicCameraResource);
  cameraModule.orthographicCameraResources.push(orthographicCameraResource);

  return camera;
}

export function getLocalCameraResource<C extends LocalCameraResource>(
  ctx: RenderThreadState,
  eid: number
): C | undefined {
  const cameraModule = getModule(ctx, CameraModule);
  return cameraModule.cameraResources.get(eid) as C | undefined;
}

export function CameraUpdateSystem(ctx: RenderThreadState) {
  const cameraModule = getModule(ctx, CameraModule);
  updatePerspectiveCameras(cameraModule);
  updateOrthographicCameras(cameraModule);
}

function updatePerspectiveCameras(cameraModule: CameraModuleState) {
  for (let i = 0; i < cameraModule.perspectiveCameraResources.length; i++) {
    const { camera, sharedCamera } = cameraModule.perspectiveCameraResources[i];

    const props = getReadObjectBufferView(sharedCamera);

    if (!props.needsUpdate[0]) {
      continue;
    }

    camera.layers.mask = props.layers[0];
    camera.fov = props.yfov[0];
    camera.near = props.znear[0];
    camera.far = props.zfar[0];

    // Renderer will update aspect based on the viewport if the aspectRatio is set to 0
    if (props.aspectRatio[0]) {
      camera.aspect = props.aspectRatio[0];
    }

    if (props.projectionMatrixNeedsUpdate[0]) {
      camera.updateProjectionMatrix();
    }
  }
}

function updateOrthographicCameras(cameraModule: CameraModuleState) {
  for (let i = 0; i < cameraModule.orthographicCameraResources.length; i++) {
    const { camera, sharedCamera } = cameraModule.orthographicCameraResources[i];

    const props = getReadObjectBufferView(sharedCamera);

    if (!props.needsUpdate[0]) {
      continue;
    }

    camera.layers.mask = props.layers[0];
    camera.left = -props.xmag[0];
    camera.right = props.xmag[0];
    camera.top = props.ymag[0];
    camera.bottom = -props.ymag[0];
    camera.near = props.znear[0];
    camera.far = props.zfar[0];

    if (props.projectionMatrixNeedsUpdate[0]) {
      camera.updateProjectionMatrix();
    }
  }
}
