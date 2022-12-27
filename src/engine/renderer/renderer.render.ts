import {
  ImageBitmapLoader,
  LinearToneMapping,
  PCFSoftShadowMap,
  sRGBEncoding,
  WebGLRenderer,
  DataArrayTexture,
  PMREMGenerator,
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { swapReadBufferFlags } from "../allocator/TripleBuffer";
import { BaseThreadContext, defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { getLocalResource, RenderNode, RenderScene } from "../resource/resource.render";
import { updateLocalSceneResources } from "../scene/scene.render";
import { StatsModule } from "../stats/stats.render";
import { createDisposables } from "../utils/createDisposables";
import { RenderWorkerResizeMessage, WorkerMessageType } from "../WorkerMessage";
import {
  InitializeCanvasMessage,
  InitializeRendererTripleBuffersMessage,
  NotifySceneRendererMessage,
  RendererMessageType,
  rendererModuleName,
  RendererStateTripleBuffer,
} from "./renderer.common";
import { updateLocalNodeResources } from "../node/node.render";
import { ResourceId } from "../resource/resource.common";
import { RenderPipeline } from "./RenderPipeline";
import patchShaderChunks from "../material/patchShaderChunks";
import { updateNodeReflections, updateReflectionProbeTextureArray } from "../reflection-probe/reflection-probe.render";
import { CameraType } from "../resource/schema";
import { MatrixMaterial } from "../material/MatrixMaterial";

export interface RenderThreadState extends BaseThreadContext {
  canvas?: HTMLCanvasElement;
  elapsed: number;
  dt: number;
  gameToRenderTripleBufferFlags: Uint8Array;
}

export interface RendererModuleState {
  needsResize: boolean;
  canvasWidth: number;
  canvasHeight: number;
  renderer: WebGLRenderer;
  renderPipeline: RenderPipeline;
  imageBitmapLoader: ImageBitmapLoader;
  imageBitmapLoaderFlipY: ImageBitmapLoader;
  rgbeLoader: RGBELoader;
  ktx2Loader: KTX2Loader;
  rendererStateTripleBuffer: RendererStateTripleBuffer;
  reflectionProbesMap: DataArrayTexture | null;
  pmremGenerator: PMREMGenerator;
  prevCameraResource?: ResourceId;
  prevSceneResource?: ResourceId;
  sceneRenderedRequests: { id: number; sceneResourceId: ResourceId }[];
  matrixMaterial: MatrixMaterial;
  enableMatrixMaterial: boolean;
}

export const RendererModule = defineModule<RenderThreadState, RendererModuleState>({
  name: rendererModuleName,
  async create(ctx, { waitForMessage }) {
    const { canvasTarget, initialCanvasHeight, initialCanvasWidth } = await waitForMessage<InitializeCanvasMessage>(
      Thread.Main,
      RendererMessageType.InitializeCanvas
    );

    patchShaderChunks();

    const canvas = (canvasTarget || ctx.canvas) as HTMLCanvasElement | OffscreenCanvas;

    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")!;
    const rendererName = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    // Enable logarithmicDepthBuffer in Chrome on M1 Mac when using the OpenGL backend
    // TODO: https://github.com/matrix-org/thirdroom/issues/118
    const logarithmicDepthBuffer =
      typeof rendererName === "string" &&
      rendererName.includes("Apple M1") &&
      rendererName.includes("ANGLE") &&
      !rendererName.includes("ANGLE Metal Renderer");

    if (logarithmicDepthBuffer) {
      console.log("Chrome OpenGL backend on M1 Mac detected, logarithmicDepthBuffer enabled");
    }

    const renderer = new WebGLRenderer({
      powerPreference: "high-performance",
      canvas: canvasTarget || ctx.canvas,
      context: gl,
      logarithmicDepthBuffer,
    });
    renderer.debug.checkShaderErrors = true;
    renderer.outputEncoding = sRGBEncoding;
    renderer.toneMapping = LinearToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.info.autoReset = false;
    renderer.setSize(initialCanvasWidth, initialCanvasHeight, false);

    const { rendererStateTripleBuffer } = await waitForMessage<InitializeRendererTripleBuffersMessage>(
      Thread.Game,
      RendererMessageType.InitializeRendererTripleBuffers
    );

    const pmremGenerator = new PMREMGenerator(renderer);

    pmremGenerator.compileEquirectangularShader();

    const imageBitmapLoader = new ImageBitmapLoader();

    const matrixMaterial = await MatrixMaterial.load(imageBitmapLoader);

    return {
      needsResize: true,
      renderer,
      renderPipeline: new RenderPipeline(renderer),
      canvasWidth: initialCanvasWidth,
      canvasHeight: initialCanvasHeight,
      rendererStateTripleBuffer,
      scenes: [],
      imageBitmapLoader,
      imageBitmapLoaderFlipY: new ImageBitmapLoader().setOptions({
        imageOrientation: "flipY",
      }),
      rgbeLoader: new RGBELoader(),
      ktx2Loader: new KTX2Loader().setTranscoderPath("/basis/").detectSupport(renderer),
      reflectionProbesMap: null,
      pmremGenerator,
      sceneRenderedRequests: [],
      matrixMaterial,
      enableMatrixMaterial: false,
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, WorkerMessageType.RenderWorkerResize, onResize),
      registerMessageHandler(ctx, RendererMessageType.NotifySceneRendered, onNotifySceneRendered),
      registerMessageHandler(ctx, "enable-matrix-material", onEnableMatrixMaterial),
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
  state.dt = (now - state.elapsed) / 1000;
  state.elapsed = now;

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

function onNotifySceneRendered(ctx: RenderThreadState, { id, sceneResourceId }: NotifySceneRendererMessage) {
  const renderer = getModule(ctx, RendererModule);
  renderer.sceneRenderedRequests.push({ id, sceneResourceId });
}

export function RendererSystem(ctx: RenderThreadState) {
  const rendererModule = getModule(ctx, RendererModule);
  const { needsResize, canvasWidth, canvasHeight, renderPipeline } = rendererModule;

  const rendererStateView = getReadObjectBufferView(rendererModule.rendererStateTripleBuffer);
  const activeSceneResourceId = rendererStateView.activeSceneResourceId[0];
  const activeCameraResourceId = rendererStateView.activeCameraResourceId[0];

  const activeSceneResource = getLocalResource<RenderScene>(ctx, activeSceneResourceId);
  const activeCameraNode = getLocalResource<RenderNode>(ctx, activeCameraResourceId);

  if (activeSceneResourceId !== rendererModule.prevSceneResource) {
    rendererModule.enableMatrixMaterial = false;
  }

  if (
    activeCameraNode &&
    activeCameraNode.cameraObject &&
    activeCameraNode.camera &&
    (needsResize || rendererModule.prevCameraResource !== activeCameraResourceId)
  ) {
    if (
      "isPerspectiveCamera" in activeCameraNode.cameraObject &&
      activeCameraNode.camera.type === CameraType.Perspective
    ) {
      if (activeCameraNode.camera.aspectRatio === 0) {
        activeCameraNode.cameraObject.aspect = canvasWidth / canvasHeight;
      }
    }

    activeCameraNode.cameraObject.updateProjectionMatrix();

    renderPipeline.setSize(canvasWidth, canvasHeight);
    rendererModule.needsResize = false;
    rendererModule.prevCameraResource = activeCameraResourceId;
    rendererModule.prevSceneResource = activeSceneResourceId;
  }

  updateLocalSceneResources(ctx, activeSceneResourceId);
  updateLocalNodeResources(ctx, rendererModule, activeSceneResource, activeCameraNode);

  updateReflectionProbeTextureArray(ctx, activeSceneResource);
  updateNodeReflections(ctx, activeSceneResource);

  if (activeSceneResource && activeCameraNode && activeCameraNode.cameraObject) {
    renderPipeline.render(activeSceneResource.sceneObject, activeCameraNode.cameraObject, ctx.dt);
  }

  for (let i = rendererModule.sceneRenderedRequests.length - 1; i >= 0; i--) {
    const { id, sceneResourceId } = rendererModule.sceneRenderedRequests[i];

    if (activeSceneResource && activeSceneResource.resourceId === sceneResourceId) {
      ctx.sendMessage(Thread.Game, {
        type: RendererMessageType.SceneRenderedNotification,
        id,
      });

      rendererModule.sceneRenderedRequests.splice(i, 1);
    }
  }
}

function onEnableMatrixMaterial(ctx: RenderThreadState, message: any) {
  const renderer = getModule(ctx, RendererModule);
  renderer.enableMatrixMaterial = message.enabled;
}
