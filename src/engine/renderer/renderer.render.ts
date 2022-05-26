import {
  ACESFilmicToneMapping,
  Camera,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
} from "three";

import { createCursorBuffer, addViewMatrix4, addView } from "../allocator/CursorBuffer";
import { TripleBuffer } from "../allocator/TripleBuffer";
import { maxEntities } from "../config.common";
import { GLTFResourceLoader } from "../gltf/GLTFResourceLoader";
import { defineModule } from "../module/module.common";
import {
  RenderThreadState,
  IInitialRenderThreadState,
  TransformView,
  Renderable,
  RenderableView,
} from "../RenderWorker";
import { CameraResourceLoader } from "../resources/CameraResourceLoader";
import { GeometryResourceLoader } from "../resources/GeometryResourceLoader";
import { LightResourceLoader } from "../resources/LightResourceLoader";
import { MaterialResourceLoader } from "../resources/MaterialResourceLoader";
import { MeshResourceLoader } from "../resources/MeshResourceLoader";
import { createResourceManager, registerResourceLoader, ResourceManager } from "../resources/ResourceManager";
import { SceneResourceLoader } from "../resources/SceneResourceLoader";
import { TextureResourceLoader } from "../resources/TextureResourceLoader";
import { RenderableMessages } from "../WorkerMessage";

interface RendererModuleState {
  needsResize: boolean;
  canvasWidth: number;
  canvasHeight: number;
  scene: Object3D;
  camera: Camera;
  renderer: WebGLRenderer;
  resourceManager: ResourceManager;
  renderableMessageQueue: RenderableMessages[];
  renderables: Renderable[];
  objectToEntityMap: Map<Object3D, number>;
  renderableIndices: Map<number, number>;
  renderableTripleBuffer: TripleBuffer;
  transformViews: TransformView[];
  renderableViews: RenderableView[];
}

export const RendererModule = defineModule<RenderThreadState, IInitialRenderThreadState, RendererModuleState>({
  create({
    resourceManagerBuffer,
    gameWorkerMessageTarget,
    initialCanvasWidth,
    initialCanvasHeight,
    canvasTarget,
    renderableTripleBuffer,
  }) {
    const scene = new Scene();

    // TODO: initialize playerRig from GameWorker
    const camera = new PerspectiveCamera(70, initialCanvasWidth / initialCanvasHeight, 0.1, 1000);
    camera.position.y = 1.6;

    const resourceManager = createResourceManager(resourceManagerBuffer, gameWorkerMessageTarget);
    registerResourceLoader(resourceManager, SceneResourceLoader);
    registerResourceLoader(resourceManager, GeometryResourceLoader);
    registerResourceLoader(resourceManager, TextureResourceLoader);
    registerResourceLoader(resourceManager, MaterialResourceLoader);
    registerResourceLoader(resourceManager, MeshResourceLoader);
    registerResourceLoader(resourceManager, CameraResourceLoader);
    registerResourceLoader(resourceManager, LightResourceLoader);
    registerResourceLoader(resourceManager, GLTFResourceLoader);

    const renderer = new WebGLRenderer({ antialias: true, canvas: canvasTarget });
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.setSize(initialCanvasWidth, initialCanvasHeight, false);

    const cursorBuffers = renderableTripleBuffer.buffers.map((b) => createCursorBuffer(b));

    const transformViews = cursorBuffers.map(
      (buffer) =>
        ({
          // note: needs synced with renderableBuffer properties in game worker
          // todo: abstract the need to sync structure with renderableBuffer properties
          worldMatrix: addViewMatrix4(buffer, maxEntities),
          worldMatrixNeedsUpdate: addView(buffer, Uint8Array, maxEntities),
        } as TransformView)
    );

    const renderableViews = cursorBuffers.map(
      (buffer) =>
        ({
          resourceId: addView(buffer, Uint32Array, maxEntities),
          interpolate: addView(buffer, Uint8Array, maxEntities),
          visible: addView(buffer, Uint8Array, maxEntities),
        } as RenderableView)
    );

    return {
      scene,
      camera,
      needsResize: true,
      renderer,
      resourceManager,
      canvasWidth: initialCanvasWidth,
      canvasHeight: initialCanvasHeight,
      renderableMessageQueue: [],
      objectToEntityMap: new Map(),
      renderables: [],
      renderableIndices: new Map<number, number>(),
      renderableTripleBuffer,
      transformViews,
      renderableViews,
    };
  },
  init(ctx) {},
});
