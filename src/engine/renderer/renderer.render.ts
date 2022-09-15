import {
  ImageBitmapLoader,
  LinearToneMapping,
  PCFSoftShadowMap,
  sRGBEncoding,
  WebGLRenderer,
  DataArrayTexture,
  PMREMGenerator,
  Clock,
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";

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
import { PostMessageTarget, RenderWorkerResizeMessage, WorkerMessageType } from "../WorkerMessage";
import {
  InitializeCanvasMessage,
  InitializeRendererTripleBuffersMessage,
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
import { NodeResourceType } from "../node/node.common";
import { ResourceId } from "../resource/resource.common";
import { TilesRendererResourceType } from "../tiles-renderer/tiles-renderer.common";
import { onLoadTilesRenderer } from "../tiles-renderer/tiles-renderer.render";
import { RenderPipeline } from "./RenderPipeline";
import patchShaderChunks from "../material/patchShaderChunks";
import { ReflectionProbeResourceType } from "../reflection-probe/reflection-probe.common";
import {
  onLoadLocalReflectionProbeResource,
  updateNodeReflections,
  updateReflectionProbeTextureArray,
} from "../reflection-probe/reflection-probe.render";
import { ReflectionProbe } from "../reflection-probe/ReflectionProbe";

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
  renderPipeline: RenderPipeline;
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
  dynamicResolutionScaling: boolean;
  limitFramerate: boolean;
}

export const RendererModule = defineModule<RenderThreadState, RendererModuleState>({
  name: rendererModuleName,
  async create(ctx, { waitForMessage }) {
    const { canvasTarget, initialCanvasHeight, initialCanvasWidth } = await waitForMessage<InitializeCanvasMessage>(
      Thread.Main,
      RendererMessageType.InitializeCanvas
    );

    patchShaderChunks();

    const renderer = new WebGLRenderer({
      powerPreference: "high-performance",
      canvas: canvasTarget || ctx.canvas,
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

    return {
      needsResize: true,
      renderer,
      renderPipeline: new RenderPipeline(renderer),
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
      dynamicResolutionScaling: true,
      limitFramerate: false,
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

// framerate limiting: https://stackoverflow.com/questions/11285065/limiting-framerate-in-three-js-to-increase-performance-requestanimationframe

const COMMON_REFRESH_RATES = [60, 75, 90, 120, 144, 165, 170, 175, 180, 185, 200, 240];

export function startRenderLoop(ctx: RenderThreadState) {
  const renderer = getModule(ctx, RendererModule);

  const clock = new Clock();
  const targetDelta = 1 / COMMON_REFRESH_RATES[0];
  let delta = 0;

  const renderLoop = () => {
    requestAnimationFrame(renderLoop);
    if (renderer.limitFramerate) {
      delta += clock.getDelta();
      if (delta > targetDelta) {
        onUpdate(ctx);
        delta = delta % targetDelta;
      }
    } else {
      onUpdate(ctx);
    }
  };

  renderLoop();
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

export function RendererSystem(ctx: RenderThreadState) {
  const rendererModule = getModule(ctx, RendererModule);
  const { needsResize, canvasWidth, canvasHeight, renderPipeline } = rendererModule;

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

    renderPipeline.setSize(canvasWidth, canvasHeight);
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
    renderPipeline.render(activeSceneResource.scene, activeCameraNode.cameraObject, ctx.dt);
  }
}
