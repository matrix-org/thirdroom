import {
  Scene,
  ImageBitmapLoader,
  PCFSoftShadowMap,
  sRGBEncoding,
  WebGLRenderer,
  DataArrayTexture,
  PMREMGenerator,
  Object3D,
  NoToneMapping,
  Vector2,
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";

import {
  ConsumerThreadContext,
  defineModule,
  getModule,
  registerMessageHandler,
  Thread,
} from "../module/module.common";
import { RenderAccessor, RenderNode, RenderWorld } from "../resource/resource.render";
import { createDisposables } from "../utils/createDisposables";
import {
  CanvasResizeMessage,
  EnableMatrixMaterialMessage,
  EnterXRMessage,
  InitializeCanvasMessage,
  NotifySceneRendererMessage,
  RendererMessageType,
  rendererModuleName,
  RenderQuality,
  XRMode,
  XRSessionModeToXRMode,
} from "./renderer.common";
import { ResourceId } from "../resource/resource.common";
import { RenderPipeline } from "./RenderPipeline";
import patchShaderChunks from "./patchShaderChunks";
import { MatrixMaterial } from "./MatrixMaterial";
import { HologramMaterial } from "./HologramMaterial";
import { ArrayBufferKTX2Loader } from "./ArrayBufferKTX2Loader";

export interface RenderContext extends ConsumerThreadContext {
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
  hologramMaterial: HologramMaterial;
  enableMatrixMaterial: boolean;
  scene: Scene;
  xrAvatarRoot: Object3D;
  dynamicAccessors: RenderAccessor[];
  xrMode: Uint8Array;
  quality: RenderQuality;
}

// TODO: Add multiviewStereo to three types once https://github.com/mrdoob/three.js/pull/24048 is merged.
declare module "three" {
  interface WebGLRendererParameters {
    multiviewStereo: boolean;
  }
}

export const RendererModule = defineModule<RenderContext, RendererModuleState>({
  name: rendererModuleName,
  async create(ctx, { waitForMessage, sendMessage }) {
    const { canvasTarget, initialCanvasHeight, initialCanvasWidth, supportedXRSessionModes, quality } =
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

    const immersiveAR =
      supportedXRSessionModes &&
      supportedXRSessionModes.some((mode) => mode === "immersive-ar") &&
      localStorage.getItem("feature_immersiveAR") === "true";

    const renderer = new WebGLRenderer({
      powerPreference: "high-performance",
      canvas: canvasTarget || ctx.canvas,
      context: gl,
      logarithmicDepthBuffer,
      multiviewStereo: true,
      alpha: immersiveAR,
    });
    renderer.debug.checkShaderErrors = true;
    renderer.outputEncoding = sRGBEncoding;
    renderer.toneMapping = NoToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.info.autoReset = false;
    renderer.setSize(initialCanvasWidth, initialCanvasHeight, false);

    if (supportedXRSessionModes) {
      renderer.xr.enabled = true;
    }

    const onSessionEnd = () => {
      onExitXR(ctx);
    };

    renderer.xr.addEventListener("sessionend", onSessionEnd);

    const xrMode = new Uint8Array(new SharedArrayBuffer(1));

    sendMessage(Thread.Game, RendererMessageType.InitializeGameRendererTripleBuffer, xrMode);

    const pmremGenerator = new PMREMGenerator(renderer);

    pmremGenerator.compileEquirectangularShader();

    const imageBitmapLoader = new ImageBitmapLoader();
    const matrixMaterial = await MatrixMaterial.load(imageBitmapLoader);

    const ktx2Loader = new KTX2Loader().setTranscoderPath("/basis/").detectSupport(renderer) as ArrayBufferKTX2Loader;

    await ktx2Loader.init();

    const scene = new Scene();
    const xrAvatarRoot = new Object3D();
    scene.add(xrAvatarRoot);

    return {
      needsResize: true,
      renderer,
      renderPipeline: new RenderPipeline(renderer, quality),
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
      hologramMaterial: new HologramMaterial(new Vector2(initialCanvasWidth, initialCanvasHeight)),
      scene,
      xrAvatarRoot,
      dynamicAccessors: [],
      xrMode,
      quality,
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

export function startRenderLoop(ctx: RenderContext) {
  const { renderer } = getModule(ctx, RendererModule);
  renderer.setAnimationLoop(() => onUpdate(ctx));
}

function onUpdate(ctx: RenderContext) {
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

function onResize(ctx: RenderContext, { canvasWidth, canvasHeight }: CanvasResizeMessage) {
  const renderer = getModule(ctx, RendererModule);
  renderer.needsResize = true;
  renderer.canvasWidth = canvasWidth;
  renderer.canvasHeight = canvasHeight;
}

function onNotifySceneRendered(ctx: RenderContext, { id, sceneResourceId, frames }: NotifySceneRendererMessage) {
  const renderer = getModule(ctx, RendererModule);
  renderer.sceneRenderedRequests.push({ id, sceneResourceId, frames });
}

function onEnterXR(ctx: RenderContext, { session, mode }: EnterXRMessage) {
  const { renderer, xrMode } = getModule(ctx, RendererModule);
  renderer.xr.setSession(session as unknown as any);
  Atomics.store(xrMode, 0, XRSessionModeToXRMode[mode] || XRMode.None);
}

function onExitXR(ctx: RenderContext) {
  const { xrMode } = getModule(ctx, RendererModule);
  Atomics.store(xrMode, 0, XRMode.None);
}

function onEnableMatrixMaterial(ctx: RenderContext, message: EnableMatrixMaterialMessage) {
  const renderer = getModule(ctx, RendererModule);
  renderer.enableMatrixMaterial = message.enabled;
}
