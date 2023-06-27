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
  LineSegments,
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import initYoga, { Yoga } from "yoga-wasm-web";
import yogaUrl from "yoga-wasm-web/dist/yoga.wasm?url";

import {
  ConsumerThreadContext,
  defineModule,
  getModule,
  registerMessageHandler,
  Thread,
} from "../module/module.common";
import {
  getLocalResource,
  RenderAccessor,
  RenderImage,
  RenderNode,
  RenderUICanvas,
  RenderUIText,
  RenderWorld,
} from "./RenderResources";
import { createDisposables } from "../utils/createDisposables";
import {
  CanvasResizeMessage,
  EnableMatrixMaterialMessage,
  EnterXRMessage,
  InitializeRendererMessage,
  NotifySceneRendererMessage,
  PhysicsDebugRenderTripleBuffer,
  PhysicsEnableDebugRenderMessage,
  RendererMessageType,
  rendererModuleName,
  RenderQuality,
  SetNodeOptimizationsEnabledMessage,
  SetXRReferenceSpaceMessage,
  SharedXRInputSource,
  UIButtonFocusMessage,
  UIButtonPressMessage,
  UIButtonUnfocusMessage,
  UICanvasFocusMessage,
  UICanvasPressMessage,
  UpdateXRInputSourcesMessage,
  XRCameraPoseSchema,
  XRCameraPoseTripleBuffer,
  XRControllerPosesSchema,
  XRControllerPosesTripleBuffer,
  XRHandPosesSchema,
  XRHandPosesTripleBuffer,
  XRMode,
  XRSessionModeToXRMode,
} from "./renderer.common";
import { ResourceId } from "../resource/resource.common";
import { RenderPipeline } from "./RenderPipeline";
import patchShaderChunks from "./materials/patchShaderChunks";
import { MatrixMaterial } from "./materials/MatrixMaterial";
import { HologramMaterial } from "./materials/HologramMaterial";
import { ArrayBufferKTX2Loader } from "./ArrayBufferKTX2Loader";
import { findHitButton } from "./ui";
import { StatsBuffer } from "../stats/stats.common";
import { XRInputLayout, XRInputProfileManager } from "./xr/WebXRInputProfiles";
import { InputRingBuffer } from "../common/InputRingBuffer";
import { createObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { InputSourceId } from "../input/input.common";

export interface RenderContext extends ConsumerThreadContext {
  canvas?: HTMLCanvasElement;
  elapsed: number;
  dt: number;
  gameToRenderTripleBufferFlags: Uint8Array;
  renderToGameTripleBufferFlags: Uint8Array;
  worldResource: RenderWorld;
}

export interface XRInputSourceItem {
  id: number;
  inputSource: XRInputSource;
  layout: XRInputLayout;
  controllerPoses: XRControllerPosesTripleBuffer;
  handPoses?: XRHandPosesTripleBuffer;
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
  debugRender: boolean;
  debugRenderTripleBuffer?: PhysicsDebugRenderTripleBuffer;
  debugLines?: LineSegments;
  nodeOptimizationsEnabled: boolean;
  loadingImages: Set<RenderImage>;
  loadingText: Set<RenderUIText>;
  yoga: Yoga;
  statsBuffer: StatsBuffer;
  staleFrameCounter: number;
  staleTripleBufferCounter: number;
  inputSourceItems: XRInputSourceItem[];
  inputRingBuffer: InputRingBuffer;
  inputProfileManager: XRInputProfileManager;
  cameraPose?: XRViewerPose;
  cameraPoseTripleBuffer: XRCameraPoseTripleBuffer;
  leftControllerPose?: XRPose;
  rightControllerPose?: XRPose;
  updateReferenceSpaceHand?: XRHandedness;
  originalReferenceSpace?: XRReferenceSpace;
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
    const {
      canvasTarget,
      initialCanvasHeight,
      initialCanvasWidth,
      supportedXRSessionModes,
      quality,
      statsBuffer,
      inputRingBuffer,
    } = await waitForMessage<InitializeRendererMessage>(Thread.Main, RendererMessageType.InitializeRenderer);

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

    const yogaWasm = await fetch(yogaUrl);
    const yogaWasmBuffer = await yogaWasm.arrayBuffer();
    const yoga = await initYoga(yogaWasmBuffer);

    const scene = new Scene();
    const xrAvatarRoot = new Object3D();
    scene.add(xrAvatarRoot);

    const inputProfilesBasePath = new URL("/webxr-input-profiles", location.href);
    const cameraPoseTripleBuffer = createObjectTripleBuffer(XRCameraPoseSchema, ctx.renderToGameTripleBufferFlags);

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
      debugRender: false,
      nodeOptimizationsEnabled: true,
      yoga,
      loadingImages: new Set(),
      // HACK: figure out why sometimes text.value is undefined
      loadingText: new Set(),
      statsBuffer,
      staleFrameCounter: 0,
      staleTripleBufferCounter: 0,
      inputProfileManager: new XRInputProfileManager(inputProfilesBasePath.href),
      inputSourceItems: [],
      inputRingBuffer,
      cameraPoseTripleBuffer,
    };
  },
  init(ctx) {
    const { renderer, inputSourceItems, inputProfileManager, cameraPoseTripleBuffer } = getModule(ctx, RendererModule);

    let nextInputSourceId = Object.keys(InputSourceId).length;

    async function onXRInputSourcesChanged(event: XRInputSourceChangeEvent) {
      try {
        const items = await Promise.all(
          Array.from(event.added).map((inputSource) =>
            createXRInputSourceItem(ctx, inputProfileManager, nextInputSourceId++, inputSource)
          )
        );

        inputSourceItems.push(...items);

        const added: SharedXRInputSource[] = items.map(({ id, inputSource, layout, controllerPoses, handPoses }) => ({
          id,
          handedness: inputSource.handedness,
          layout,
          cameraPose: cameraPoseTripleBuffer,
          controllerPoses,
          handPoses,
        }));

        const removed: number[] = [];

        for (const inputSource of event.removed) {
          const index = inputSourceItems.findIndex((item) => item.inputSource === inputSource);

          if (index !== -1) {
            removed.push(inputSourceItems[index].id);
            inputSourceItems.splice(index, 1);
          }
        }

        ctx.sendMessage<UpdateXRInputSourcesMessage>(Thread.Game, {
          type: RendererMessageType.UpdateXRInputSources,
          added,
          removed,
        });
      } catch (error) {
        console.error(error);
      }
    }

    async function onXRSessionStart() {
      try {
        const session = renderer.xr.getSession();

        if (session) {
          const items = await Promise.all(
            Array.from(session.inputSources).map((inputSource) =>
              createXRInputSourceItem(ctx, inputProfileManager, nextInputSourceId++, inputSource)
            )
          );

          inputSourceItems.push(...items);

          const added: SharedXRInputSource[] = items.map(({ id, inputSource, layout, controllerPoses, handPoses }) => ({
            id,
            handedness: inputSource.handedness,
            layout,
            cameraPose: cameraPoseTripleBuffer,
            controllerPoses,
            handPoses,
          }));

          ctx.sendMessage<UpdateXRInputSourcesMessage>(Thread.Game, {
            type: RendererMessageType.UpdateXRInputSources,
            added,
            removed: [],
          });

          session.addEventListener("inputsourceschange", onXRInputSourcesChanged);
        }
      } catch (error) {
        console.error(error);
      }
    }

    function onXRSessionEnd() {
      const rendererModule = getModule(ctx, RendererModule);
      const removed = inputSourceItems.map((source) => source.id);

      ctx.sendMessage<UpdateXRInputSourcesMessage>(Thread.Game, {
        type: RendererMessageType.UpdateXRInputSources,
        added: [],
        removed,
      });

      inputSourceItems.length = 0;

      rendererModule.originalReferenceSpace = undefined;
    }

    renderer.xr.addEventListener("sessionstart", onXRSessionStart);
    renderer.xr.addEventListener("sessionend", onXRSessionEnd);

    const disposeSessionHandlers = () => {
      renderer.xr.removeEventListener("sessionstart", onXRSessionStart);
      renderer.xr.removeEventListener("sessionend", onXRSessionEnd);
    };

    return createDisposables([
      registerMessageHandler(ctx, RendererMessageType.CanvasResize, onResize),
      registerMessageHandler(ctx, RendererMessageType.NotifySceneRendered, onNotifySceneRendered),
      registerMessageHandler(ctx, RendererMessageType.EnableMatrixMaterial, onEnableMatrixMaterial),
      registerMessageHandler(ctx, RendererMessageType.EnterXR, onEnterXR),
      registerMessageHandler(ctx, RendererMessageType.PhysicsEnableDebugRender, onEnableDebugRender),
      registerMessageHandler(ctx, RendererMessageType.PhysicsDisableDebugRender, onDisableDebugRender),
      registerMessageHandler(ctx, RendererMessageType.SetNodeOptimizationsEnabled, onSetNodeOptimizationsEnabled),
      registerMessageHandler(ctx, RendererMessageType.PrintRenderThreadState, onPrintRenderThreadState),
      registerMessageHandler(ctx, RendererMessageType.UICanvasPress, onUICanvasPressed),
      registerMessageHandler(ctx, RendererMessageType.UICanvasFocus, onUICanvasFocused),
      registerMessageHandler(ctx, RendererMessageType.SetXRReferenceSpace, onSetXRReferenceSpace),
      disposeSessionHandlers,
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

function onEnableDebugRender(ctx: RenderContext, { tripleBuffer }: PhysicsEnableDebugRenderMessage) {
  const physicsModule = getModule(ctx, RendererModule);
  physicsModule.debugRender = true;
  physicsModule.debugRenderTripleBuffer = tripleBuffer;
}

function onDisableDebugRender(ctx: RenderContext) {
  const physicsModule = getModule(ctx, RendererModule);
  physicsModule.debugRender = false;
  physicsModule.debugRenderTripleBuffer = undefined;
}

function onSetNodeOptimizationsEnabled(ctx: RenderContext, { enabled }: SetNodeOptimizationsEnabledMessage) {
  const renderer = getModule(ctx, RendererModule);
  renderer.nodeOptimizationsEnabled = enabled;
}

function onPrintRenderThreadState(ctx: RenderContext) {
  console.log(Thread.Render, ctx);
}

function onUICanvasFocused(ctx: RenderContext, message: UICanvasFocusMessage): void {
  const uiCanvas = getLocalResource<RenderUICanvas>(ctx, message.uiCanvasEid);
  if (!uiCanvas) {
    console.warn("Could not find UI canvas for eid", message.uiCanvasEid);
    return;
  }

  const button = findHitButton(uiCanvas, message.hitPoint);
  if (!button) {
    ctx.sendMessage<UIButtonUnfocusMessage>(Thread.Game, {
      type: RendererMessageType.UIButtonUnfocus,
    });
    return;
  }

  ctx.sendMessage<UIButtonFocusMessage>(Thread.Game, {
    type: RendererMessageType.UIButtonFocus,
    buttonEid: button.eid,
  });
}

function onUICanvasPressed(ctx: RenderContext, message: UICanvasPressMessage): void {
  const uiCanvas = getLocalResource<RenderUICanvas>(ctx, message.uiCanvasEid);
  if (!uiCanvas) {
    console.warn("Could not find UI canvas for eid", message.uiCanvasEid);
    return;
  }

  const button = findHitButton(uiCanvas, message.hitPoint);
  if (!button) return;

  ctx.sendMessage<UIButtonPressMessage>(Thread.Game, {
    type: RendererMessageType.UIButtonPress,
    buttonEid: button.eid,
  });
}

function onSetXRReferenceSpace(ctx: RenderContext, message: SetXRReferenceSpaceMessage) {
  const rendererModule = getModule(ctx, RendererModule);
  rendererModule.updateReferenceSpaceHand = message.hand;
}

async function createXRInputSourceItem(
  ctx: RenderContext,
  inputProfileManager: XRInputProfileManager,
  id: number,
  inputSource: XRInputSource
): Promise<XRInputSourceItem> {
  const profile = await inputProfileManager.fetchProfile(inputSource);

  const layout = profile.layouts[inputSource.handedness];

  if (!layout) {
    throw new Error(`No "${inputSource.handedness}" layout found for WebXR controller ${profile.profileId}`);
  }

  const assetPath = inputProfileManager.resolveAssetPath(`${profile.profileId}/${layout.assetPath}`);

  const modifiedLayout = { ...layout, assetPath };

  return {
    id,
    inputSource,
    layout: modifiedLayout,
    controllerPoses: createObjectTripleBuffer(XRControllerPosesSchema, ctx.renderToGameTripleBufferFlags),
    handPoses: inputSource.hand && createObjectTripleBuffer(XRHandPosesSchema, ctx.renderToGameTripleBufferFlags),
  };
}
