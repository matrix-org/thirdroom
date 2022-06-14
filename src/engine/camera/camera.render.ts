import { OrthographicCamera, PerspectiveCamera, Scene } from "three";

import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode, updateTransformFromNode } from "../node/node.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource } from "../resource/resource.render";
import {
  CameraType,
  OrthographicCameraTripleBuffer,
  PerspectiveCameraTripleBuffer,
  SharedOrthographicCameraResource,
  SharedPerspectiveCameraResource,
} from "./camera.common";

export interface LocalPerspectiveCameraResource {
  type: CameraType.Perspective;
  resourceId: ResourceId;
  cameraTripleBuffer: PerspectiveCameraTripleBuffer;
}

export interface LocalOrthographicCameraResource {
  type: CameraType.Orthographic;
  resourceId: ResourceId;
  cameraTripleBuffer: OrthographicCameraTripleBuffer;
}

export type LocalCameraResource = LocalOrthographicCameraResource | LocalPerspectiveCameraResource;

export async function onLoadPerspectiveCamera(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { type, cameraTripleBuffer }: SharedPerspectiveCameraResource
): Promise<LocalPerspectiveCameraResource> {
  return {
    resourceId,
    type,
    cameraTripleBuffer,
  };
}

export async function onLoadOrthographicCamera(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { type, cameraTripleBuffer }: SharedOrthographicCameraResource
): Promise<LocalOrthographicCameraResource> {
  return {
    resourceId,
    type,
    cameraTripleBuffer,
  };
}

export function updateNodeCamera(
  ctx: RenderThreadState,
  scene: Scene,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  const currentCameraResourceId = node.camera?.resourceId || 0;
  const nextCameraResourceId = nodeReadView.camera[0];

  // TODO: Handle node.visible

  if (currentCameraResourceId !== nextCameraResourceId && node.cameraObject) {
    scene.remove(node.cameraObject);
    node.cameraObject = undefined;
  }

  node.camera = getLocalResource<LocalCameraResource>(ctx, nextCameraResourceId)?.resource;

  if (!node.camera) {
    return;
  }

  const cameraType = node.camera.type;

  let camera: PerspectiveCamera | OrthographicCamera | undefined;

  if (cameraType === CameraType.Perspective) {
    let perspectiveCamera = node.lightObject as PerspectiveCamera | undefined;

    if (!perspectiveCamera) {
      perspectiveCamera = new PerspectiveCamera();
      scene.add(perspectiveCamera);
    }

    const cameraView = getReadObjectBufferView(node.camera.cameraTripleBuffer);
    perspectiveCamera.layers.mask = cameraView.layers[0];
    perspectiveCamera.fov = cameraView.yfov[0];
    perspectiveCamera.near = cameraView.znear[0];
    perspectiveCamera.far = cameraView.zfar[0];

    // Renderer will update aspect based on the viewport if the aspectRatio is set to 0
    if (cameraView.aspectRatio[0]) {
      perspectiveCamera.aspect = cameraView.aspectRatio[0];
    }

    if (cameraView.projectionMatrixNeedsUpdate[0]) {
      perspectiveCamera.updateProjectionMatrix();
    }

    camera = perspectiveCamera;
  } else if (cameraType === CameraType.Orthographic) {
    let orthographicCamera = node.lightObject as OrthographicCamera | undefined;

    if (!orthographicCamera) {
      orthographicCamera = new OrthographicCamera();
      scene.add(orthographicCamera);
    }

    const cameraView = getReadObjectBufferView(node.camera.cameraTripleBuffer);

    orthographicCamera.layers.mask = cameraView.layers[0];
    orthographicCamera.left = -cameraView.xmag[0];
    orthographicCamera.right = cameraView.xmag[0];
    orthographicCamera.top = cameraView.ymag[0];
    orthographicCamera.bottom = -cameraView.ymag[0];
    orthographicCamera.near = cameraView.znear[0];
    orthographicCamera.far = cameraView.zfar[0];

    if (cameraView.projectionMatrixNeedsUpdate[0]) {
      orthographicCamera.updateProjectionMatrix();
    }

    camera = orthographicCamera;
  }

  if (camera) {
    updateTransformFromNode(ctx, nodeReadView, camera);
  }

  node.cameraObject = camera;
}
