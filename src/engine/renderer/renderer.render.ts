import {
  Scene,
  ImageBitmapLoader,
  LinearToneMapping,
  PCFSoftShadowMap,
  sRGBEncoding,
  WebGLRenderer,
  DataArrayTexture,
  PMREMGenerator,
  Texture,
  Object3D,
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import {
  ConsumerThreadContext,
  defineModule,
  getModule,
  registerMessageHandler,
  Thread,
} from "../module/module.common";
import { RenderNode, RenderWorld } from "../resource/resource.render";
import { updateActiveSceneResource, updateWorldVisibility } from "../scene/scene.render";
import { createDisposables } from "../utils/createDisposables";
import {
  CanvasResizeMessage,
  EnableMatrixMaterialMessage,
  EnterXRMessage,
  InitializeCanvasMessage,
  NotifySceneRendererMessage,
  RendererMessageType,
  rendererModuleName,
} from "./renderer.common";
import { updateLocalNodeResources, updateNodesFromXRPoses } from "../node/node.render";
import { ResourceId } from "../resource/resource.common";
import { RenderPipeline } from "./RenderPipeline";
import patchShaderChunks from "../material/patchShaderChunks";
import { updateNodeReflections, updateReflectionProbeTextureArray } from "../reflection-probe/reflection-probe.render";
import { CameraType } from "../resource/schema";
import { MatrixMaterial } from "../material/MatrixMaterial";
import { ArrayBufferKTX2Loader, initKTX2Loader, updateImageResources, updateTextureResources } from "../utils/textures";
import { updateTileRenderers } from "../tiles-renderer/tiles-renderer.render";
import { InputModule } from "../input/input.render";

export interface RenderThreadState extends ConsumerThreadContext {
  canvas?: HTMLCanvasElement;
  elapsed: number;
  dt: number;
  gameToRenderTripleBufferFlags: Uint8Array;
  renderToGameTripleBufferFlags: Uint8Array;
  worldResource: RenderWorld;
}

export interface RendererModuleState {
  needsResize: boolean;
  canvasWidth: number;
  canvasHeight: number;
  renderer: WebGLRenderer;
  renderPipeline: RenderPipeline;
  rgbeLoader: RGBELoader;
  ktx2Loader: ArrayBufferKTX2Loader;
  reflectionProbesMap: DataArrayTexture | null;
  tileRendererNodes: RenderNode[];
  pmremGenerator: PMREMGenerator;
  prevCameraResource?: ResourceId;
  prevSceneResource?: ResourceId;
  sceneRenderedRequests: { id: number; sceneResourceId: ResourceId; frames: number }[];
  matrixMaterial: MatrixMaterial;
  enableMatrixMaterial: boolean;
  scene: Scene;
  xrAvatarRoot: Object3D;
}

// TODO: Add multiviewStereo to three types once https://github.com/mrdoob/three.js/pull/24048 is merged.
declare module "three" {
  interface WebGLRendererParameters {
    multiviewStereo: boolean;
  }
}

export const RendererModule = defineModule<RenderThreadState, RendererModuleState>({
  name: rendererModuleName,
  async create(ctx, { waitForMessage }) {
    const { canvasTarget, initialCanvasHeight, initialCanvasWidth, enableXR } =
      await waitForMessage<InitializeCanvasMessage>(Thread.Main, RendererMessageType.InitializeCanvas);

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
      multiviewStereo: true,
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

    // Set the texture anisotropy which improves rendering at extreme angles.
    // Note this uses the GPU's maximum anisotropy with an upper limit of 8. We may want to bump this cap up to 16
    // but we should provide a quality setting for GPUs with a high max anisotropy but limited overall resources.
    Texture.DEFAULT_ANISOTROPY = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    if (enableXR) {
      renderer.xr.enabled = true;
    }

    const pmremGenerator = new PMREMGenerator(renderer);

    pmremGenerator.compileEquirectangularShader();

    const imageBitmapLoader = new ImageBitmapLoader();
    const matrixMaterial = await MatrixMaterial.load(imageBitmapLoader);

    const ktx2Loader = await initKTX2Loader("/basis/", renderer);

    const scene = new Scene();
    const xrAvatarRoot = new Object3D();
    scene.add(xrAvatarRoot);

    return {
      needsResize: true,
      renderer,
      renderPipeline: new RenderPipeline(renderer),
      canvasWidth: initialCanvasWidth,
      canvasHeight: initialCanvasHeight,
      scenes: [],
      rgbeLoader: new RGBELoader(),
      ktx2Loader,
      reflectionProbesMap: null,
      tileRendererNodes: [],
      pmremGenerator,
      sceneRenderedRequests: [],
      matrixMaterial,
      enableMatrixMaterial: false,
      scene,
      xrAvatarRoot,
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, RendererMessageType.CanvasResize, onResize),
      registerMessageHandler(ctx, RendererMessageType.NotifySceneRendered, onNotifySceneRendered),
      registerMessageHandler(ctx, RendererMessageType.EnableMatrixMaterial, onEnableMatrixMaterial),
      registerMessageHandler(ctx, RendererMessageType.EnterXR, onEnterXR),
    ]);
  },
});

export function startRenderLoop(state: RenderThreadState) {
  const { renderer } = getModule(state, RendererModule);
  renderer.setAnimationLoop(() => onUpdate(state));
}

function onUpdate(ctx: RenderThreadState) {
  const now = performance.now();
  ctx.dt = (now - ctx.elapsed) / 1000;
  ctx.elapsed = now;

  for (let i = 0; i < ctx.systems.length; i++) {
    ctx.systems[i](ctx);
  }

  if (ctx.singleConsumerThreadSharedState) {
    ctx.singleConsumerThreadSharedState.update();
  }
}

function onResize(state: RenderThreadState, { canvasWidth, canvasHeight }: CanvasResizeMessage) {
  const renderer = getModule(state, RendererModule);
  renderer.needsResize = true;
  renderer.canvasWidth = canvasWidth;
  renderer.canvasHeight = canvasHeight;
}

function onNotifySceneRendered(ctx: RenderThreadState, { id, sceneResourceId, frames }: NotifySceneRendererMessage) {
  const renderer = getModule(ctx, RendererModule);
  renderer.sceneRenderedRequests.push({ id, sceneResourceId, frames });
}

function onEnterXR(ctx: RenderThreadState, { session }: EnterXRMessage) {
  const { renderer } = getModule(ctx, RendererModule);
  renderer.xr.setSession(session as unknown as any);
}

export function RendererSystem(ctx: RenderThreadState) {
  const rendererModule = getModule(ctx, RendererModule);
  const inputModule = getModule(ctx, InputModule);
  const { needsResize, canvasWidth, canvasHeight, renderPipeline, tileRendererNodes } = rendererModule;

  const activeScene = ctx.worldResource.environment?.publicScene;
  const activeCameraNode = ctx.worldResource.activeCameraNode;

  // TODO: Remove this
  if (activeScene?.eid !== rendererModule.prevSceneResource) {
    rendererModule.enableMatrixMaterial = false;
  }

  if (
    activeCameraNode &&
    activeCameraNode.cameraObject &&
    activeCameraNode.camera &&
    (needsResize || rendererModule.prevCameraResource !== activeCameraNode.eid)
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
    rendererModule.prevCameraResource = activeCameraNode.eid;
    rendererModule.prevSceneResource = activeScene?.eid;
  }

  updateImageResources(ctx);
  updateTextureResources(ctx);
  updateWorldVisibility(ctx);
  updateActiveSceneResource(ctx, activeScene);
  updateLocalNodeResources(ctx, rendererModule);
  updateTileRenderers(ctx, tileRendererNodes, activeCameraNode);
  updateReflectionProbeTextureArray(ctx, activeScene);
  updateNodeReflections(ctx, activeScene);
  updateNodesFromXRPoses(ctx, rendererModule, inputModule);

  if (activeScene && activeCameraNode && activeCameraNode.cameraObject) {
    renderPipeline.render(rendererModule.scene, activeCameraNode.cameraObject, ctx.dt);
  }

  for (let i = rendererModule.sceneRenderedRequests.length - 1; i >= 0; i--) {
    const request = rendererModule.sceneRenderedRequests[i];

    if (activeScene && activeScene.eid === request.sceneResourceId && --request.frames <= 0) {
      ctx.sendMessage(Thread.Game, {
        type: RendererMessageType.SceneRenderedNotification,
        id: request.id,
      });

      rendererModule.sceneRenderedRequests.splice(i, 1);
    }
  }
}

function onEnableMatrixMaterial(ctx: RenderThreadState, message: EnableMatrixMaterialMessage) {
  const renderer = getModule(ctx, RendererModule);
  renderer.enableMatrixMaterial = message.enabled;
}
