import {
  ACESFilmicToneMapping,
  // Matrix4,
  PCFSoftShadowMap,
  PerspectiveCamera,
  // Quaternion,
  sRGBEncoding,
  // Vector3,
  WebGLRenderer,
} from "three";

import { getReadObjectBufferView, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { swapReadBufferFlags } from "../allocator/TripleBuffer";
import { CameraType } from "../camera/camera.common";
import { LocalCameraResource } from "../camera/camera.render";
// import { clamp } from "../component/transform";
// import { tickRate } from "../config.common";
import { BaseThreadContext, defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { getLocalResource } from "../resource/resource.render";
import { LocalSceneResource } from "../scene/scene.render";
import { StatsModule } from "../stats/stats.render";
import { PostMessageTarget, RenderWorkerResizeMessage, WorkerMessageType } from "../WorkerMessage";
import {
  InitializeCanvasMessage,
  InitializeRendererTripleBuffersMessage,
  RendererMessageType,
  rendererModuleName,
  rendererSchema,
} from "./renderer.common";

export interface RenderThreadState extends BaseThreadContext {
  canvas?: HTMLCanvasElement;
  elapsed: number;
  dt: number;
  gameWorkerMessageTarget: PostMessageTarget;
  gameToRenderTripleBufferFlags: Uint8Array;
}

interface RendererModuleState {
  needsResize: boolean;
  canvasWidth: number;
  canvasHeight: number;
  renderer: WebGLRenderer;
  sharedRendererState: TripleBufferBackedObjectBufferView<typeof rendererSchema, ArrayBuffer>;
}

export const RendererModule = defineModule<RenderThreadState, RendererModuleState>({
  name: rendererModuleName,
  async create(ctx, { sendMessage, waitForMessage }) {
    const { canvasTarget, initialCanvasHeight, initialCanvasWidth } = await waitForMessage<InitializeCanvasMessage>(
      Thread.Main,
      RendererMessageType.InitializeCanvas
    );

    const renderer = new WebGLRenderer({ antialias: true, canvas: canvasTarget || ctx.canvas });
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.setSize(initialCanvasWidth, initialCanvasHeight, false);

    const { sharedRendererState } = await waitForMessage<InitializeRendererTripleBuffersMessage>(
      Thread.Game,
      RendererMessageType.InitializeRendererTripleBuffers
    );

    return {
      needsResize: true,
      renderer,
      canvasWidth: initialCanvasWidth,
      canvasHeight: initialCanvasHeight,
      sharedRendererState,
    };
  },
  init(ctx) {
    registerMessageHandler(ctx, WorkerMessageType.RenderWorkerResize, onResize);
  },
});

export function startRenderLoop(state: RenderThreadState) {
  const { renderer } = getModule(state, RendererModule);
  renderer.setAnimationLoop(() => onUpdate(state));
}

// const tempMatrix4 = new Matrix4();
// const tempPosition = new Vector3();
// const tempQuaternion = new Quaternion();
// const tempScale = new Vector3();

function onUpdate(state: RenderThreadState) {
  const bufferSwapped = swapReadBufferFlags(state.gameToRenderTripleBufferFlags);

  const renderModule = getModule(state, RendererModule);
  const { needsResize, renderer, canvasWidth, canvasHeight } = renderModule;

  const now = performance.now();
  //const dt = (state.dt = now - state.elapsed);
  state.elapsed = now;
  //const frameRate = 1 / dt;
  //const lerpAlpha = clamp(tickRate / frameRate, 0, 1);

  // const sharedRendererState = getReadObjectBufferView(renderModule.sharedRendererState);

  // for (let i = 0; i < renderables.length; i++) {
  //   const { object, helper, eid } = renderables[i];

  //   if (!object) {
  //     continue;
  //   }

  //   object.visible = !!Renderable.visible[eid];

  //   if (!Transform.worldMatrixNeedsUpdate[eid]) {
  //     continue;
  //   }

  //   if (Renderable.interpolate[eid]) {
  //     tempMatrix4.fromArray(Transform.worldMatrix[eid]).decompose(tempPosition, tempQuaternion, tempScale);
  //     object.position.lerp(tempPosition, lerpAlpha);
  //     object.quaternion.slerp(tempQuaternion, lerpAlpha);
  //     object.scale.lerp(tempScale, lerpAlpha);

  //     if (helper) {
  //       helper.position.copy(object.position);
  //       helper.quaternion.copy(object.quaternion);
  //       helper.scale.copy(object.scale);
  //     }
  //   } else {
  //     tempMatrix4.fromArray(Transform.worldMatrix[eid]).decompose(object.position, object.quaternion, object.scale);
  //     object.matrix.fromArray(Transform.worldMatrix[eid]);
  //     object.matrixWorld.fromArray(Transform.worldMatrix[eid]);
  //     object.matrixWorldNeedsUpdate = false;

  //     if (helper) {
  //       helper.position.copy(object.position);
  //       helper.quaternion.copy(object.quaternion);
  //       helper.scale.copy(object.scale);
  //     }
  //   }
  // }

  const sceneResource = getActiveLocalSceneResource(state);
  const cameraResource = getActiveLocalCameraResource(state);

  if (cameraResource && needsResize) {
    const perspectiveCamera = cameraResource.camera as PerspectiveCamera;

    if (cameraResource.type === CameraType.Perspective && cameraResource.sharedCamera.aspectRatio[0] === 0) {
      perspectiveCamera.aspect = canvasWidth / canvasHeight;
    }

    perspectiveCamera.updateProjectionMatrix();

    renderer.setSize(canvasWidth, canvasHeight, false);
    renderModule.needsResize = false;
  }

  if (sceneResource && cameraResource) {
    renderModule.renderer.render(sceneResource.scene, cameraResource.camera);
  }

  for (let i = 0; i < state.systems.length; i++) {
    state.systems[i](state);
  }

  const stats = getModule(state, StatsModule);

  if (bufferSwapped) {
    if (stats.staleTripleBufferCounter > 1) {
      stats.staleFrameCounter++;
    }

    stats.staleTripleBufferCounter = 0;
  } else {
    stats.staleTripleBufferCounter++;
  }
}

function onResize(state: RenderThreadState, { canvasWidth, canvasHeight }: RenderWorkerResizeMessage) {
  const renderer = getModule(state, RendererModule);
  renderer.needsResize = true;
  renderer.canvasWidth = canvasWidth;
  renderer.canvasHeight = canvasHeight;
}

export function getActiveLocalSceneResource(ctx: RenderThreadState): LocalSceneResource | undefined {
  const renderModule = getModule(ctx, RendererModule);
  const sharedRendererState = getReadObjectBufferView(renderModule.sharedRendererState);
  const resourceId = sharedRendererState.activeSceneResourceId[0];
  const localResource = getLocalResource<LocalSceneResource>(ctx, resourceId);
  return localResource?.resource;
}

export function getActiveLocalCameraResource(ctx: RenderThreadState): LocalCameraResource | undefined {
  const renderModule = getModule(ctx, RendererModule);
  const sharedRendererState = getReadObjectBufferView(renderModule.sharedRendererState);
  const resourceId = sharedRendererState.activeCameraResourceId[0];
  const localResource = getLocalResource<LocalCameraResource>(ctx, resourceId);
  return localResource?.resource;
}
