import {
  ImageBitmapLoader,
  LinearToneMapping,
  PCFSoftShadowMap,
  sRGBEncoding,
  WebGLRenderer,
  DataArrayTexture,
  PMREMGenerator,
  Layers,
  Scene,
  Camera,
  WebGLRenderTarget,
  LinearFilter,
  RGBAFormat,
  Vector2,
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { swapReadBufferFlags } from "../allocator/TripleBuffer";
import { BufferViewResourceType, onLoadBufferView } from "../bufferView/bufferView.common";
import { CameraType } from "../camera/camera.common";
import { onLoadOrthographicCamera, onLoadPerspectiveCamera } from "../camera/camera.render";
import { ImageResourceType } from "../image/image.common";
import { LocalImageResource, onLoadLocalImageResource, updateLocalImageResources } from "../image/image.render";
import { DirectionalLightResourceType, PointLightResourceType, SpotLightResourceType } from "../light/light.common";
import {
  onLoadLocalDirectionalLightResource,
  onLoadLocalPointLightResource,
  onLoadLocalSpotLightResource,
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
import { RenderWorkerResizeMessage, WorkerMessageType } from "../WorkerMessage";
import {
  GraphicsQualitySetting,
  InitializeCanvasMessage,
  InitializeRendererTripleBuffersMessage,
  NotifySceneRendererMessage,
  RendererMessageType,
  rendererModuleName,
  RendererStateTripleBuffer,
} from "./renderer.common";
import { OrthographicCameraResourceType, PerspectiveCameraResourceType } from "../camera/camera.common";
import { AccessorResourceType } from "../accessor/accessor.common";
import { onLoadLocalAccessorResource } from "../accessor/accessor.render";
import {
  InstancedMeshResourceType,
  MeshPrimitiveResourceType,
  MeshResourceType,
  SkinnedMeshResourceType,
  LightMapResourceType,
} from "../mesh/mesh.common";
import {
  LocalMeshPrimitive,
  onLoadLocalMeshPrimitiveResource,
  onLoadLocalMeshResource,
  onLoadLocalInstancedMeshResource,
  updateLocalMeshPrimitiveResources,
  onLoadLocalSkinnedMeshResource,
  onLoadLocalLightMapResource,
} from "../mesh/mesh.render";
import { LocalNode, onLoadLocalNode, updateLocalNodeResources } from "../node/node.render";
import { Layer, NodeResourceType } from "../node/node.common";
import { ResourceId } from "../resource/resource.common";
import { TilesRendererResourceType } from "../tiles-renderer/tiles-renderer.common";
import { onLoadTilesRenderer } from "../tiles-renderer/tiles-renderer.render";
import patchShaderChunks from "../material/patchShaderChunks";
import { ReflectionProbeResourceType } from "../reflection-probe/reflection-probe.common";
import {
  onLoadLocalReflectionProbeResource,
  updateNodeReflections,
  updateReflectionProbeTextureArray,
} from "../reflection-probe/reflection-probe.render";
import { ReflectionProbe } from "../reflection-probe/ReflectionProbe";

// TODO: Add samples property to official three types package
declare module "three" {
  interface WebGLRenderTargetOptions {
    samples: number;
  }
}

export interface RenderThreadState extends BaseThreadContext {
  canvas?: HTMLCanvasElement;
  quality: GraphicsQualitySetting;
  elapsed: number;
  dt: number;
  gameToRenderTripleBufferFlags: Uint8Array;
}

export interface RendererModuleState {
  needsResize: boolean;
  canvasWidth: number;
  canvasHeight: number;
  renderer: WebGLRenderer;
  imageBitmapLoader: ImageBitmapLoader;
  imageBitmapLoaderFlipY: ImageBitmapLoader;
  rgbeLoader: RGBELoader;
  ktx2Loader: KTX2Loader;
  rendererStateTripleBuffer: RendererStateTripleBuffer;
  scenes: LocalSceneResource[]; // done
  unlitMaterials: LocalUnlitMaterialResource[]; // done
  standardMaterials: LocalStandardMaterialResource[]; // done
  images: LocalImageResource[]; // done
  textures: LocalTextureResource[]; // done
  meshPrimitives: LocalMeshPrimitive[]; // mostly done, still need to figure out material disposal
  nodes: LocalNode[]; // done
  reflectionProbes: ReflectionProbe[];
  reflectionProbesMap: DataArrayTexture | null;
  pmremGenerator: PMREMGenerator;
  prevCameraResource?: ResourceId;
  prevSceneResource?: ResourceId;
  sceneRenderedRequests: { id: number; sceneResourceId: ResourceId }[];
  effectComposer: EffectComposer;
  renderPass: RenderPass;
  outlinePass: OutlinePass;
  bloomPass: UnrealBloomPass;
  gammaCorrectionPass: ShaderPass;
  outlineLayers: Layers;
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
      // Use MSAA for the forward render pass
      antialias: ctx.quality === GraphicsQualitySetting.Low,
    });
    renderer.debug.checkShaderErrors = true;
    renderer.outputEncoding = sRGBEncoding;
    renderer.toneMapping = LinearToneMapping;

    renderer.toneMappingExposure = 1;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = ctx.quality > GraphicsQualitySetting.Low;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.info.autoReset = false;
    renderer.setSize(initialCanvasWidth, initialCanvasHeight, false);

    const { rendererStateTripleBuffer } = await waitForMessage<InitializeRendererTripleBuffersMessage>(
      Thread.Game,
      RendererMessageType.InitializeRendererTripleBuffers
    );

    const pmremGenerator = new PMREMGenerator(renderer);

    pmremGenerator.compileEquirectangularShader();

    const rendererSize = renderer.getSize(new Vector2());

    const target =
      ctx.quality > GraphicsQualitySetting.Low
        ? new WebGLRenderTarget(rendererSize.width, rendererSize.height, {
            minFilter: LinearFilter,
            magFilter: LinearFilter,
            format: RGBAFormat,
            encoding: sRGBEncoding,
            samples: 16,
          })
        : undefined;

    const scene = new Scene();
    const camera = new Camera();

    const effectComposer = new EffectComposer(renderer, target);
    const renderPass = new RenderPass(scene, camera);
    const outlinePass = new OutlinePass(rendererSize, scene, camera);
    const bloomPass = new UnrealBloomPass(rendererSize, 0.4, 0.4, 0.9);
    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

    effectComposer.addPass(renderPass);
    effectComposer.addPass(outlinePass);

    if (ctx.quality > GraphicsQualitySetting.Low) {
      effectComposer.addPass(bloomPass);
    }

    effectComposer.addPass(gammaCorrectionPass);

    const outlineLayers = new Layers();
    outlineLayers.set(Layer.EditorSelection);

    return {
      needsResize: true,
      renderer,
      effectComposer,
      renderPass,
      outlinePass,
      bloomPass,
      gammaCorrectionPass,
      outlineLayers,
      canvasWidth: initialCanvasWidth,
      canvasHeight: initialCanvasHeight,
      rendererStateTripleBuffer,
      scenes: [],
      images: [],
      textures: [],
      unlitMaterials: [],
      standardMaterials: [],
      directionalLights: [],
      pointLights: [],
      spotLights: [],
      imageBitmapLoader: new ImageBitmapLoader(),
      imageBitmapLoaderFlipY: new ImageBitmapLoader().setOptions({
        imageOrientation: "flipY",
      }),
      rgbeLoader: new RGBELoader(),
      ktx2Loader: new KTX2Loader().setTranscoderPath("/basis/").detectSupport(renderer),
      meshPrimitives: [],
      nodes: [],
      reflectionProbes: [],
      reflectionProbesMap: null,
      pmremGenerator,
      tilesRenderers: [],
      sceneRenderedRequests: [],
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, WorkerMessageType.RenderWorkerResize, onResize),
      registerMessageHandler(ctx, RendererMessageType.NotifySceneRendered, onNotifySceneRendered),
      registerResourceLoader(ctx, SamplerResourceType, onLoadSampler),
      registerResourceLoader(ctx, SceneResourceType, onLoadLocalSceneResource),
      registerResourceLoader(ctx, UnlitMaterialResourceType, onLoadLocalUnlitMaterialResource),
      registerResourceLoader(ctx, StandardMaterialResourceType, onLoadLocalStandardMaterialResource),
      registerResourceLoader(ctx, TextureResourceType, onLoadLocalTextureResource),
      registerResourceLoader(ctx, DirectionalLightResourceType, onLoadLocalDirectionalLightResource),
      registerResourceLoader(ctx, PointLightResourceType, onLoadLocalPointLightResource),
      registerResourceLoader(ctx, SpotLightResourceType, onLoadLocalSpotLightResource),
      registerResourceLoader(ctx, ReflectionProbeResourceType, onLoadLocalReflectionProbeResource),
      registerResourceLoader(ctx, PerspectiveCameraResourceType, onLoadPerspectiveCamera),
      registerResourceLoader(ctx, OrthographicCameraResourceType, onLoadOrthographicCamera),
      registerResourceLoader(ctx, ImageResourceType, onLoadLocalImageResource),
      registerResourceLoader(ctx, BufferViewResourceType, onLoadBufferView),
      registerResourceLoader(ctx, AccessorResourceType, onLoadLocalAccessorResource),
      registerResourceLoader(ctx, MeshResourceType, onLoadLocalMeshResource),
      registerResourceLoader(ctx, MeshPrimitiveResourceType, onLoadLocalMeshPrimitiveResource),
      registerResourceLoader(ctx, InstancedMeshResourceType, onLoadLocalInstancedMeshResource),
      registerResourceLoader(ctx, LightMapResourceType, onLoadLocalLightMapResource),
      registerResourceLoader(ctx, SkinnedMeshResourceType, onLoadLocalSkinnedMeshResource),
      registerResourceLoader(ctx, NodeResourceType, onLoadLocalNode),
      registerResourceLoader(ctx, TilesRendererResourceType, onLoadTilesRenderer),
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
  const { needsResize, canvasWidth, canvasHeight } = rendererModule;

  const rendererStateView = getReadObjectBufferView(rendererModule.rendererStateTripleBuffer);
  const activeSceneResourceId = rendererStateView.activeSceneResourceId[0];
  const activeCameraResourceId = rendererStateView.activeCameraResourceId[0];

  const activeSceneResource = getLocalResource<LocalSceneResource>(ctx, activeSceneResourceId)?.resource;
  const activeCameraNode = getLocalResource<LocalNode>(ctx, activeCameraResourceId)?.resource;

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
      const cameraStateView = getReadObjectBufferView(activeCameraNode.camera.cameraTripleBuffer);

      if (cameraStateView.aspectRatio[0] === 0) {
        activeCameraNode.cameraObject.aspect = canvasWidth / canvasHeight;
      }
    }

    activeCameraNode.cameraObject.updateProjectionMatrix();

    rendererModule.renderer.setSize(canvasWidth, canvasHeight, false);
    rendererModule.effectComposer.setSize(canvasWidth, canvasHeight);
    rendererModule.needsResize = false;
    rendererModule.prevCameraResource = activeCameraResourceId;
  }

  updateLocalImageResources(ctx, rendererModule.images);
  updateLocalTextureResources(ctx, rendererModule.textures);
  updateLocalSceneResources(ctx, rendererModule.scenes);
  updateLocalUnlitMaterialResources(ctx, rendererModule.unlitMaterials);
  updateLocalStandardMaterialResources(ctx, rendererModule.standardMaterials);
  updateLocalMeshPrimitiveResources(ctx, rendererModule.meshPrimitives);
  updateLocalNodeResources(ctx, rendererModule, rendererModule.nodes, activeSceneResource, activeCameraNode);

  updateReflectionProbeTextureArray(ctx, activeSceneResource);
  updateNodeReflections(ctx, activeSceneResource, rendererModule.nodes);

  if (activeSceneResource && activeCameraNode && activeCameraNode.cameraObject) {
    const scene = activeSceneResource.scene;
    const camera = activeCameraNode.cameraObject;

    rendererModule.renderPass.scene = scene;
    rendererModule.renderPass.camera = camera;
    rendererModule.outlinePass.renderScene = scene;
    rendererModule.outlinePass.renderCamera = camera;

    rendererModule.outlinePass.selectedObjects.length = 0;

    scene.traverse((child) => {
      if (child.layers.test(rendererModule.outlineLayers)) {
        rendererModule.outlinePass.selectedObjects.push(child);
      }
    });

    if (ctx.quality > GraphicsQualitySetting.Low || rendererModule.outlinePass.selectedObjects.length > 0) {
      rendererModule.effectComposer.render(ctx.dt);
    } else {
      rendererModule.renderer.render(scene, camera);
    }
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
