import { OrthographicCamera, PerspectiveCamera, Scene, MathUtils } from "three";

import { ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode, updateTransformFromNode } from "../node/node.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { getLocalResource, getResourceDisposed } from "../resource/resource.render";
import { CameraType, LocalCamera } from "../resource/schema";

export function updateNodeCamera(
  ctx: RenderThreadState,
  scene: Scene,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  const currentCameraResourceId = node.camera?.resourceId || 0;
  const nextCameraResourceId = nodeReadView.camera[0];

  // TODO: Handle node.visible

  if (getResourceDisposed(ctx, nextCameraResourceId)) {
    if (node.cameraObject) {
      scene.remove(node.cameraObject);
      node.cameraObject = undefined;
    }

    node.camera = undefined;
  }

  if (currentCameraResourceId !== nextCameraResourceId) {
    if (node.cameraObject) {
      scene.remove(node.cameraObject);
      node.cameraObject = undefined;
    }

    if (nextCameraResourceId) {
      node.camera = getLocalResource<LocalCamera>(ctx, nextCameraResourceId)?.resource;
    } else {
      node.camera = undefined;
    }
  }

  if (!node.camera) {
    return;
  }

  const localCamera = node.camera;

  let camera: PerspectiveCamera | OrthographicCamera | undefined;

  if (localCamera.type === CameraType.Perspective) {
    let perspectiveCamera = node.cameraObject as PerspectiveCamera | undefined;

    if (!perspectiveCamera) {
      perspectiveCamera = new PerspectiveCamera();
      scene.add(perspectiveCamera);
    }

    perspectiveCamera.layers.mask = localCamera.layers;
    perspectiveCamera.fov = localCamera.yfov * MathUtils.RAD2DEG;
    perspectiveCamera.near = localCamera.znear;
    perspectiveCamera.far = localCamera.zfar;

    // Renderer will update aspect based on the viewport if the aspectRatio is set to 0
    if (localCamera.aspectRatio) {
      perspectiveCamera.aspect = localCamera.aspectRatio;
    }

    if (localCamera.projectionMatrixNeedsUpdate) {
      perspectiveCamera.updateProjectionMatrix();
    }

    camera = perspectiveCamera;
  } else if (localCamera.type === CameraType.Orthographic) {
    let orthographicCamera = node.cameraObject as OrthographicCamera | undefined;

    if (!orthographicCamera) {
      orthographicCamera = new OrthographicCamera();
      scene.add(orthographicCamera);
    }

    orthographicCamera.layers.mask = localCamera.layers;
    orthographicCamera.left = -localCamera.xmag;
    orthographicCamera.right = localCamera.xmag;
    orthographicCamera.top = localCamera.ymag;
    orthographicCamera.bottom = -localCamera.ymag;
    orthographicCamera.near = localCamera.znear;
    orthographicCamera.far = localCamera.zfar;

    if (localCamera.projectionMatrixNeedsUpdate) {
      orthographicCamera.updateProjectionMatrix();
    }

    camera = orthographicCamera;
  }

  if (camera) {
    updateTransformFromNode(ctx, nodeReadView, camera);
  }

  node.cameraObject = camera;
}
