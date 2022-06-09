import { OrthographicCamera, PerspectiveCamera } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import {
  CameraType,
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

export async function onLoadPerspectiveCamera(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedCamera }: SharedPerspectiveCameraResource
): Promise<PerspectiveCamera> {
  const rendererModule = getModule(ctx, RendererModule);

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

  rendererModule.perspectiveCameraResources.push(perspectiveCameraResource);

  return camera;
}

export async function onLoadOrthographicCamera(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedCamera }: SharedOrthographicCameraResource
): Promise<OrthographicCamera> {
  const rendererModule = getModule(ctx, RendererModule);

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

  rendererModule.orthographicCameraResources.push(orthographicCameraResource);

  return camera;
}

export function updateLocalPerspectiveCameraResources(perspectiveCameraResources: LocalPerspectiveCameraResource[]) {
  for (let i = 0; i < perspectiveCameraResources.length; i++) {
    const { camera, sharedCamera } = perspectiveCameraResources[i];

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

export function updateLocalOrthographicCameraResources(orthographicCameraResources: LocalOrthographicCameraResource[]) {
  for (let i = 0; i < orthographicCameraResources.length; i++) {
    const { camera, sharedCamera } = orthographicCameraResources[i];

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
