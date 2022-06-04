import { OrthographicCamera, PerspectiveCamera } from "three";

import { getReadObjectBufferView, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { defineModule, getModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { registerResourceLoader } from "../resource/resource.render";
import {
  CameraType,
  OrthographicCameraResourceType,
  orthographicCameraSchema,
  PerspectiveCameraResourceType,
  perspectiveCameraSchema,
  SharedOrthographicCameraResource,
  SharedPerspectiveCameraResource,
} from "./camera.common";

interface LocalPerspectiveCameraResource {
  type: CameraType.Perspective;
  camera: PerspectiveCamera;
  sharedCamera: TripleBufferBackedObjectBufferView<typeof perspectiveCameraSchema, ArrayBuffer>;
}

interface LocalOrthographicCameraResource {
  type: CameraType.Orthographic;
  camera: OrthographicCamera;
  sharedCamera: TripleBufferBackedObjectBufferView<typeof orthographicCameraSchema, ArrayBuffer>;
}

type LocalCameraResource = LocalOrthographicCameraResource | LocalPerspectiveCameraResource;

type CameraModuleState = {
  cameraResources: Map<number, LocalCameraResource>;
};

export const CameraModule = defineModule<RenderThreadState, CameraModuleState>({
  name: "camera",
  create() {
    return {
      cameraResources: new Map(),
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

  cameraModule.cameraResources.set(eid, {
    type,
    camera,
    sharedCamera,
  });

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

  cameraModule.cameraResources.set(eid, {
    type,
    camera,
    sharedCamera,
  });

  return camera;
}

export function CameraUpdateSystem(ctx: RenderThreadState) {
  const { cameraResources } = getModule(ctx, CameraModule);

  for (const [, cameraResource] of cameraResources) {
    if (cameraResource.type === CameraType.Perspective) {
      const props = getReadObjectBufferView(cameraResource.sharedCamera);

      if (!props.needsUpdate[0]) {
        continue;
      }

      const perspectiveCamera = cameraResource.camera;
      perspectiveCamera.layers.mask = props.layers[0];
      perspectiveCamera.fov = props.yfov[0];
      perspectiveCamera.near = props.znear[0];
      perspectiveCamera.far = props.zfar[0];

      // Renderer will update aspect based on the viewport if the aspectRatio is set to 0
      if (props.aspectRatio[0]) {
        perspectiveCamera.aspect = props.aspectRatio[0];
      }

      if (props.projectionMatrixNeedsUpdate[0]) {
        perspectiveCamera.updateProjectionMatrix();
      }
    } else {
      const props = getReadObjectBufferView(cameraResource.sharedCamera);

      if (!props.needsUpdate[0]) {
        continue;
      }

      const orthographicCamera = cameraResource.camera;
      orthographicCamera.layers.mask = props.layers[0];
      orthographicCamera.left = -props.xmag[0];
      orthographicCamera.right = props.xmag[0];
      orthographicCamera.top = props.ymag[0];
      orthographicCamera.bottom = -props.ymag[0];
      orthographicCamera.near = props.znear[0];
      orthographicCamera.far = props.zfar[0];

      if (props.projectionMatrixNeedsUpdate[0]) {
        orthographicCamera.updateProjectionMatrix();
      }
    }
  }
}
