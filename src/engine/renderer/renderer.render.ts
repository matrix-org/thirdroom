import { ACESFilmicToneMapping, ImageBitmapLoader, PCFSoftShadowMap, sRGBEncoding, WebGLRenderer } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { swapReadBufferFlags } from "../allocator/TripleBuffer";
import { BufferViewResourceType, onLoadBufferView } from "../bufferView/bufferView.common";
import { CameraType } from "../camera/camera.common";
import {
  LocalOrthographicCameraResource,
  LocalPerspectiveCameraResource,
  onLoadOrthographicCamera,
  onLoadPerspectiveCamera,
} from "../camera/camera.render";
import { ImageResourceType } from "../image/image.common";
import { onLoadLocalImageResource } from "../image/image.render";
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
import { MeshPrimitiveResourceType, MeshResourceType } from "../mesh/mesh.common";
import {
  LocalMeshPrimitive,
  onLoadLocalMeshPrimitiveResource,
  onLoadLocalMeshResource,
  updateLocalMeshPrimitiveResources,
} from "../mesh/mesh.render";
import { LocalNode, updateLocalNodeResources } from "../node/node.render";

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
  rendererStateTripleBuffer: RendererStateTripleBuffer;
  scenes: LocalSceneResource[];
  unlitMaterials: LocalUnlitMaterialResource[];
  standardMaterials: LocalStandardMaterialResource[];
  textures: LocalTextureResource[];
  perspectiveCameraResources: LocalPerspectiveCameraResource[];
  orthographicCameraResources: LocalOrthographicCameraResource[];
  meshPrimitives: LocalMeshPrimitive[];
  nodes: LocalNode[];
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

    const { rendererStateTripleBuffer } = await waitForMessage<InitializeRendererTripleBuffersMessage>(
      Thread.Game,
      RendererMessageType.InitializeRendererTripleBuffers
    );

    return {
      needsResize: true,
      renderer,
      canvasWidth: initialCanvasWidth,
      canvasHeight: initialCanvasHeight,
      rendererStateTripleBuffer,
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
      meshPrimitives: [],
      nodes: [],
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
      registerResourceLoader(ctx, MeshResourceType, onLoadLocalMeshResource),
      registerResourceLoader(ctx, MeshPrimitiveResourceType, onLoadLocalMeshPrimitiveResource),
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
  const rendererStateView = getReadObjectBufferView(renderModule.rendererStateTripleBuffer);
  const resourceId = rendererStateView.activeSceneResourceId[0];
  const localResource = getLocalResource<LocalSceneResource>(ctx, resourceId);
  return localResource?.resource;
}

export function getActiveLocalCameraResource(ctx: RenderThreadState): LocalNode | undefined {
  const renderModule = getModule(ctx, RendererModule);
  const rendererStateView = getReadObjectBufferView(renderModule.rendererStateTripleBuffer);
  const resourceId = rendererStateView.activeCameraResourceId[0];
  const localResource = getLocalResource<LocalNode>(ctx, resourceId);
  return localResource?.resource;
}

export function RendererSystem(ctx: RenderThreadState) {
  const rendererModule = getModule(ctx, RendererModule);

  const { needsResize, renderer, canvasWidth, canvasHeight } = rendererModule;

  const activeSceneResource = getActiveLocalSceneResource(ctx);
  const activeCameraNode = getActiveLocalCameraResource(ctx);

  if (activeCameraNode && activeCameraNode.cameraObject && activeCameraNode.camera && needsResize) {
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

    renderer.setSize(canvasWidth, canvasHeight, false);
    rendererModule.needsResize = false;
  }

  updateLocalSceneResources(ctx, rendererModule.scenes);
  updateLocalTextureResources(rendererModule.textures);
  updateLocalUnlitMaterialResources(ctx, rendererModule.unlitMaterials);
  updateLocalStandardMaterialResources(ctx, rendererModule.standardMaterials);
  updateLocalMeshPrimitiveResources(ctx, rendererModule.meshPrimitives);
  updateLocalNodeResources(ctx, rendererModule, rendererModule.nodes);

  if (activeSceneResource && activeCameraNode && activeCameraNode.cameraObject) {
    rendererModule.renderer.render(activeSceneResource.scene, activeCameraNode.cameraObject);
  }
}
