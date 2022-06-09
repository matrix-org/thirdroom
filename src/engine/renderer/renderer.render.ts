import {
  ACESFilmicToneMapping,
  ImageBitmapLoader,
  // Matrix4,
  PCFSoftShadowMap,
  PerspectiveCamera,
  // Quaternion,
  sRGBEncoding,
  // Vector3,
  WebGLRenderer,
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import { getReadObjectBufferView, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { swapReadBufferFlags } from "../allocator/TripleBuffer";
import { BufferViewResourceType, onLoadBufferView } from "../bufferView/bufferView.common";
import { CameraType } from "../camera/camera.common";
import {
  LocalCameraResource,
  LocalOrthographicCameraResource,
  LocalPerspectiveCameraResource,
  onLoadOrthographicCamera,
  onLoadPerspectiveCamera,
  updateLocalOrthographicCameraResources,
  updateLocalPerspectiveCameraResources,
} from "../camera/camera.render";
import { ImageResourceType } from "../image/image.common";
import { onLoadLocalImageResource } from "../image/image.render";
import { DirectionalLightResourceType, PointLightResourceType, SpotLightResourceType } from "../light/light.common";
import {
  LocalDirectionalLightResource,
  LocalPointLightResource,
  LocalSpotLightResource,
  onLoadLocalDirectionalLightResource,
  onLoadLocalPointLightResource,
  onLoadLocalSpotLightResource,
  updateLocalDirectionalLightResources,
  updateLocalPointLightResources,
  updateLocalSpotLightResources,
} from "../light/light.render";
import { UnlitMaterialResourceType, StandardMaterialResourceType } from "../material/material.common";
import {
  LocalStandardMaterialResource,
  LocalUnlitMaterialResource,
  onLoadLocalStandardMaterialResource,
  onLoadLocalUnlitMaterialResource,
  updateLocalStandardMaterialResources,
  updateLocalUnlitMaterialResources,
} from "../material/material.render";
// import { clamp } from "../component/transform";
// import { tickRate } from "../config.common";
import { BaseThreadContext, defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { getLocalResource, registerResourceLoader } from "../resource/resource.render";
import { SamplerResourceType } from "../sampler/sampler.common";
import { onLoadSampler } from "../sampler/sampler.render";
import { SceneResourceType } from "../scene/scene.common";
import { LocalSceneResource, onLoadLocalSceneResource, updateLocalSceneResources } from "../scene/scene.render";
import { StatsModule } from "../stats/stats.render";
import { TextureResourceType } from "../texture/texture.common";
import {
  LocalTextureResource,
  onLoadLocalTextureResource,
  updateLocalTextureResources,
} from "../texture/texture.render";
import { createDisposables } from "../utils/createDisposables";
import { PostMessageTarget, RenderWorkerResizeMessage, WorkerMessageType } from "../WorkerMessage";
import {
  InitializeCanvasMessage,
  InitializeRendererTripleBuffersMessage,
  RendererMessageType,
  rendererModuleName,
  rendererSchema,
} from "./renderer.common";
import { OrthographicCameraResourceType, PerspectiveCameraResourceType } from "../camera/camera.common";
import { AccessorResourceType } from "../accessor/accessor.common";
import { onLoadLocalAccessorResource } from "../accessor/accessor.render";

export interface RenderThreadState extends BaseThreadContext {
  canvas?: HTMLCanvasElement;
  elapsed: number;
  dt: number;
  gameWorkerMessageTarget: PostMessageTarget;
  gameToRenderTripleBufferFlags: Uint8Array;
}

export interface RendererModuleState {
  needsResize: boolean;
  canvasWidth: number;
  canvasHeight: number;
  renderer: WebGLRenderer;
  imageBitmapLoader: ImageBitmapLoader;
  rgbeLoader: RGBELoader;
  sharedRendererState: TripleBufferBackedObjectBufferView<typeof rendererSchema, ArrayBuffer>;
  scenes: LocalSceneResource[];
  unlitMaterials: LocalUnlitMaterialResource[];
  standardMaterials: LocalStandardMaterialResource[];
  textures: LocalTextureResource[];
  directionalLights: LocalDirectionalLightResource[];
  pointLights: LocalPointLightResource[];
  spotLights: LocalSpotLightResource[];
  perspectiveCameraResources: LocalPerspectiveCameraResource[];
  orthographicCameraResources: LocalOrthographicCameraResource[];
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
      scenes: [],
      textures: [],
      unlitMaterials: [],
      standardMaterials: [],
      directionalLights: [],
      pointLights: [],
      spotLights: [],
      imageBitmapLoader: new ImageBitmapLoader(),
      rgbeLoader: new RGBELoader(),
      perspectiveCameraResources: [],
      orthographicCameraResources: [],
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, WorkerMessageType.RenderWorkerResize, onResize),
      registerResourceLoader(ctx, SamplerResourceType, onLoadSampler),
      registerResourceLoader(ctx, SceneResourceType, onLoadLocalSceneResource),
      registerResourceLoader(ctx, UnlitMaterialResourceType, onLoadLocalUnlitMaterialResource),
      registerResourceLoader(ctx, StandardMaterialResourceType, onLoadLocalStandardMaterialResource),
      registerResourceLoader(ctx, TextureResourceType, onLoadLocalTextureResource),
      registerResourceLoader(ctx, DirectionalLightResourceType, onLoadLocalDirectionalLightResource),
      registerResourceLoader(ctx, PointLightResourceType, onLoadLocalPointLightResource),
      registerResourceLoader(ctx, SpotLightResourceType, onLoadLocalSpotLightResource),
      registerResourceLoader(ctx, PerspectiveCameraResourceType, onLoadPerspectiveCamera),
      registerResourceLoader(ctx, OrthographicCameraResourceType, onLoadOrthographicCamera),
      registerResourceLoader(ctx, ImageResourceType, onLoadLocalImageResource),
      registerResourceLoader(ctx, BufferViewResourceType, onLoadBufferView),
      registerResourceLoader(ctx, AccessorResourceType, onLoadLocalAccessorResource),
    ]);
  },
});

export function startRenderLoop(state: RenderThreadState) {
  const { renderer } = getModule(state, RendererModule);
  renderer.setAnimationLoop(() => onUpdate(state));
}

function onUpdate(state: RenderThreadState) {
  const bufferSwapped = swapReadBufferFlags(state.gameToRenderTripleBufferFlags);

  const now = performance.now();
  const dt = (state.dt = now - state.elapsed);
  state.elapsed = now;
  state.dt = dt;

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

// const tempMatrix4 = new Matrix4();
// const tempPosition = new Vector3();
// const tempQuaternion = new Quaternion();
// const tempScale = new Vector3();

export function RendererSystem(ctx: RenderThreadState) {
  const rendererModule = getModule(ctx, RendererModule);

  const { needsResize, renderer, canvasWidth, canvasHeight } = rendererModule;

  const sceneResource = getActiveLocalSceneResource(ctx);
  const cameraResource = getActiveLocalCameraResource(ctx);

  // TODO: Move interpolation to node update function
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

  if (cameraResource && needsResize) {
    const perspectiveCamera = cameraResource.camera as PerspectiveCamera;

    if (cameraResource.type === CameraType.Perspective && cameraResource.sharedCamera.aspectRatio[0] === 0) {
      perspectiveCamera.aspect = canvasWidth / canvasHeight;
    }

    perspectiveCamera.updateProjectionMatrix();

    renderer.setSize(canvasWidth, canvasHeight, false);
    rendererModule.needsResize = false;
  }

  updateLocalSceneResources(ctx, rendererModule.scenes);
  updateLocalPerspectiveCameraResources(rendererModule.perspectiveCameraResources);
  updateLocalOrthographicCameraResources(rendererModule.orthographicCameraResources);
  updateLocalTextureResources(rendererModule.textures);
  updateLocalUnlitMaterialResources(ctx, rendererModule.unlitMaterials);
  updateLocalStandardMaterialResources(ctx, rendererModule.standardMaterials);
  updateLocalDirectionalLightResources(rendererModule.directionalLights);
  updateLocalPointLightResources(rendererModule.pointLights);
  updateLocalSpotLightResources(rendererModule.spotLights);

  if (sceneResource && cameraResource) {
    rendererModule.renderer.render(sceneResource.scene, cameraResource.camera);
  }
}
