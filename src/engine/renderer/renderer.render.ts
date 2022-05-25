import {
  PerspectiveCamera,
  Object3D,
  Scene,
  Camera,
  Matrix4,
  Quaternion,
  Vector3,
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  sRGBEncoding,
  WebGLRenderer,
} from "three";

import { swapReadBuffer, TripleBuffer } from "../allocator/TripleBuffer";
import { createTripleBufferView, getReadView, TripleBufferView } from "../allocator/TripleBufferView";
import { createRenderView, RenderableView } from "../component/renderable";
import { clamp, createTransformView, TransformView } from "../component/transform";
import { tickRate } from "../config.common";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { RenderThreadState } from "../RenderWorker";
import {
  ResourceManager,
  createResourceManager,
  registerResourceLoader,
  ResourceState,
  onAddResourceRef,
  onLoadResource,
  onRemoveResourceRef,
} from "../resources/ResourceManager";
import { StatsModule } from "../stats/stats.render";
import {
  RenderWorkerResizeMessage,
  RenderableMessages,
  WorkerMessageType,
  AddRenderableMessage,
  RemoveRenderableMessage,
  SetActiveSceneMessage,
  SetActiveCameraMessage,
  StartRenderWorkerMessage,
} from "../WorkerMessage";
import { IInitialRenderThreadState } from "../RenderTypes";
import { SceneResourceLoader } from "../resources/SceneResourceLoader";
import { GeometryResourceLoader } from "../resources/GeometryResourceLoader";
import { TextureResourceLoader } from "../resources/TextureResourceLoader";
import { MaterialResourceLoader } from "../resources/MaterialResourceLoader";
import { MeshResourceLoader } from "../resources/MeshResourceLoader";
import { CameraResourceLoader } from "../resources/CameraResourceLoader";
import { LightResourceLoader } from "../resources/LightResourceLoader";
import { GLTFResourceLoader } from "../gltf/GLTFResourceLoader";
import { PostMessageTarget } from "../WorkerMessage";

export interface Renderable {
  object?: Object3D;
  helper?: Object3D;
  eid: number;
  resourceId: number;
}

interface RendererModuleState {
  needsResize: boolean;
  canvasWidth: number;
  canvasHeight: number;
  scene: Scene;
  camera: Camera;
  renderer: WebGLRenderer;
  renderableMessageQueue: RenderableMessages[];
  transformView: TripleBufferView<TransformView>;
  renderableView: TripleBufferView<RenderableView>;
  renderableTripleBuffer: TripleBuffer;
  renderables: Renderable[];
  renderableIndices: Map<number, number>;
  objectToEntityMap: Map<Object3D, number>;
  resourceManager: ResourceManager;
  gameWorkerMessageTarget: PostMessageTarget;
}

export const RendererModule = defineModule<RenderThreadState, IInitialRenderThreadState, RendererModuleState>({
  create({
    initialCanvasWidth,
    initialCanvasHeight,
    canvasTarget,
    renderableTripleBuffer,
    resourceManagerBuffer,
    gameWorkerMessageTarget,
  }) {
    const scene = new Scene();

    // TODO: initialize playerRig from GameWorker
    const camera = new PerspectiveCamera(70, initialCanvasWidth / initialCanvasHeight, 0.1, 1000);
    camera.position.y = 1.6;

    const renderer = new WebGLRenderer({ antialias: true, canvas: canvasTarget });
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.setSize(initialCanvasWidth, initialCanvasHeight, false);

    const resourceManager = createResourceManager(resourceManagerBuffer, gameWorkerMessageTarget);

    const transformView = createTripleBufferView(createTransformView, renderableTripleBuffer);
    const renderableView = createTripleBufferView(createRenderView, renderableTripleBuffer);

    return {
      needsResize: true,
      canvasWidth: initialCanvasWidth,
      canvasHeight: initialCanvasHeight,
      scene,
      camera,
      renderer,
      renderableMessageQueue: [],
      transformView,
      renderableView,
      renderableTripleBuffer,
      renderableIndices: new Map(),
      renderables: [],
      objectToEntityMap: new Map(),
      resourceManager,
      gameWorkerMessageTarget,
    };
  },
  init(state) {
    const { resourceManager } = getModule(state, RendererModule);

    registerResourceLoader(resourceManager, SceneResourceLoader);
    registerResourceLoader(resourceManager, GeometryResourceLoader);
    registerResourceLoader(resourceManager, TextureResourceLoader);
    registerResourceLoader(resourceManager, MaterialResourceLoader);
    registerResourceLoader(resourceManager, MeshResourceLoader);
    registerResourceLoader(resourceManager, CameraResourceLoader);
    registerResourceLoader(resourceManager, LightResourceLoader);
    registerResourceLoader(resourceManager, GLTFResourceLoader);

    const disposables = [
      registerMessageHandler(state, WorkerMessageType.StartRenderWorker, onStart),
      registerMessageHandler(state, WorkerMessageType.RenderWorkerResize, onResize),
      registerMessageHandler(state, WorkerMessageType.AddRenderable, onRenderableMessage),
      registerMessageHandler(state, WorkerMessageType.RemoveRenderable, onRenderableMessage),
      registerMessageHandler(state, WorkerMessageType.SetActiveCamera, onRenderableMessage),
      registerMessageHandler(state, WorkerMessageType.SetActiveScene, onRenderableMessage),
      registerMessageHandler(state, WorkerMessageType.LoadResource, onLoadResource as any),
      registerMessageHandler(state, WorkerMessageType.AddResourceRef, onAddResourceRef),
      registerMessageHandler(state, WorkerMessageType.RemoveResourceRef, onRemoveResourceRef),
    ];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();

export function RendererSystem(state: RenderThreadState) {
  const rendererState = getModule(state, RendererModule);
  const { renderableTripleBuffer, transformView, renderableView, renderables } = rendererState;
  const stats = getModule(state, StatsModule);

  const frameRate = 1 / state.dt;
  const lerpAlpha = clamp(tickRate / frameRate, 0, 1);

  processRenderableMessages(state);

  const bufferSwapped = swapReadBuffer(renderableTripleBuffer);

  const Transform = getReadView(transformView);
  const Renderable = getReadView(renderableView);

  for (let i = 0; i < renderables.length; i++) {
    const { object, helper, eid } = renderables[i];

    if (!object) {
      continue;
    }

    object.visible = !!Renderable.visible[eid];

    if (!Transform.worldMatrixNeedsUpdate[eid]) {
      continue;
    }

    if (Renderable.interpolate[eid]) {
      tempMatrix4.fromArray(Transform.worldMatrix[eid]).decompose(tempPosition, tempQuaternion, tempScale);
      object.position.lerp(tempPosition, lerpAlpha);
      object.quaternion.slerp(tempQuaternion, lerpAlpha);
      object.scale.lerp(tempScale, lerpAlpha);

      if (helper) {
        helper.position.copy(object.position);
        helper.quaternion.copy(object.quaternion);
        helper.scale.copy(object.scale);
      }
    } else {
      tempMatrix4.fromArray(Transform.worldMatrix[eid]).decompose(object.position, object.quaternion, object.scale);
      object.matrix.fromArray(Transform.worldMatrix[eid]);
      object.matrixWorld.fromArray(Transform.worldMatrix[eid]);
      object.matrixWorldNeedsUpdate = false;

      if (helper) {
        helper.position.copy(object.position);
        helper.quaternion.copy(object.quaternion);
        helper.scale.copy(object.scale);
      }
    }
  }

  if (rendererState.needsResize && rendererState.camera.type === "PerspectiveCamera") {
    const perspectiveCamera = rendererState.camera as PerspectiveCamera;
    perspectiveCamera.aspect = rendererState.canvasWidth / rendererState.canvasHeight;
    perspectiveCamera.updateProjectionMatrix();
    rendererState.renderer.setSize(rendererState.canvasWidth, rendererState.canvasHeight, false);
    rendererState.needsResize = false;
  }

  rendererState.renderer.render(rendererState.scene, rendererState.camera);

  if (bufferSwapped) {
    if (stats.staleTripleBufferCounter > 1) {
      stats.staleFrameCounter++;
    }

    stats.staleTripleBufferCounter = 0;
  } else {
    stats.staleTripleBufferCounter++;
  }
}

function onStart(state: RenderThreadState, message: StartRenderWorkerMessage) {
  const { renderer } = getModule(state, RendererModule);

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    state.dt = state.elapsed - now;
    state.elapsed = now;

    const systems = state.systems;

    for (let i = 0; i < systems.length; i++) {
      systems[i](state);
    }
  });
}

function onResize(state: RenderThreadState, { canvasWidth, canvasHeight }: RenderWorkerResizeMessage) {
  const renderer = getModule(state, RendererModule);
  renderer.needsResize = true;
  renderer.canvasWidth = canvasWidth;
  renderer.canvasHeight = canvasHeight;
}

function onRenderableMessage(state: RenderThreadState, message: any) {
  const renderer = getModule(state, RendererModule);
  renderer.renderableMessageQueue.push(message);
}

function processRenderableMessages(state: RenderThreadState) {
  const renderer = getModule(state, RendererModule);

  while (renderer.renderableMessageQueue.length) {
    const message = renderer.renderableMessageQueue.shift() as RenderableMessages;

    switch (message.type) {
      case WorkerMessageType.AddRenderable:
        onAddRenderable(state, message);
        break;
      case WorkerMessageType.RemoveRenderable:
        onRemoveRenderable(state, message);
        break;
      case WorkerMessageType.SetActiveCamera:
        onSetActiveCamera(state, message);
        break;
      case WorkerMessageType.SetActiveScene:
        onSetActiveScene(state, message);
        break;
    }
  }
}

function onAddRenderable(state: RenderThreadState, message: AddRenderableMessage) {
  const { resourceId, eid } = message;
  const { renderableIndices, renderables, objectToEntityMap, scene, renderableMessageQueue, resourceManager } =
    getModule(state, RendererModule);

  let renderableIndex = renderableIndices.get(eid);
  const resourceInfo = resourceManager.store.get(resourceId);

  if (!resourceInfo) {
    console.warn(`AddRenderable Error: Unknown resourceId ${resourceId} for eid ${eid}`);
    return;
  }

  if (resourceInfo.state === ResourceState.Loaded) {
    const object = resourceInfo.resource as Object3D;

    if (renderableIndex !== undefined) {
      // Replace an existing renderable on an entity if it changed
      const removed = renderables.splice(renderableIndex, 1, { object, eid, resourceId });

      if (removed.length > 0 && removed[0].object) {
        // Remove the renderable object3D only if it exists
        scene.remove(removed[0].object);
      }
    } else {
      renderableIndex = renderables.length;
      renderableIndices.set(eid, renderables.length);
      renderables.push({ object, eid, resourceId });
      objectToEntityMap.set(object, eid);
    }

    scene.add(object);

    return;
  }

  if (resourceInfo.state === ResourceState.Loading) {
    if (renderableIndex !== undefined) {
      // Update the renderable with the new resource id and remove the old object
      const removed = renderables.splice(renderableIndex, 1, { object: undefined, eid, resourceId });

      if (removed.length > 0 && removed[0].object) {
        // Remove the previous renderable object from the scene if it exists
        scene.remove(removed[0].object);
      }
    } else {
      renderableIndex = renderables.length;
      renderableIndices.set(eid, renderables.length);
      renderables.push({ object: undefined, eid, resourceId });
    }

    // Resources that are still loading should be re-queued when they finish loading.
    resourceInfo.promise.finally(() => {
      const index = renderableIndices.get(eid);

      if (index === undefined || renderables[index].resourceId !== message.resourceId) {
        // The resource was changed since it finished loading so avoid queueing it again
        return;
      }

      renderableMessageQueue.push(message);
    });

    return;
  }

  console.warn(
    `AddRenderable Error: resourceId ${resourceId} for eid ${eid} could not be loaded: ${resourceInfo.error}`
  );
}

function onRemoveRenderable(state: RenderThreadState, { eid }: RemoveRenderableMessage) {
  const { renderableIndices, renderables, objectToEntityMap, scene } = getModule(state, RendererModule);
  const index = renderableIndices.get(eid);

  if (index !== undefined) {
    const removed = renderables.splice(index, 1);
    renderableIndices.delete(eid);

    if (removed.length > 0) {
      const { object, helper } = removed[0];

      if (object) {
        scene.remove(object);
        objectToEntityMap.delete(object);
      }

      if (helper) {
        scene.remove(helper);
        objectToEntityMap.delete(helper);
      }
    }
  }
}

function onSetActiveScene(state: RenderThreadState, { eid, resourceId }: SetActiveSceneMessage) {
  const renderer = getModule(state, RendererModule);
  const resourceInfo = renderer.resourceManager.store.get(resourceId);

  if (!resourceInfo) {
    console.error(`SetActiveScene Error: Couldn't find resource ${resourceId} for scene ${eid}`);
    return;
  }

  const setScene = (newScene: Scene) => {
    for (const child of renderer.scene.children) {
      newScene.add(child);
    }

    renderer.scene = newScene;
  };

  if (resourceInfo.resource) {
    const newScene = resourceInfo.resource as Scene;
    setScene(newScene);
  } else {
    resourceInfo.promise.then(({ resource }) => {
      setScene(resource as Scene);
    });
  }
}

function onSetActiveCamera(state: RenderThreadState, { eid }: SetActiveCameraMessage) {
  const renderer = getModule(state, RendererModule);
  const index = renderer.renderableIndices.get(eid);

  if (index !== undefined && renderer.renderables[index]) {
    const camera = renderer.renderables[index].object as Camera;

    const perspectiveCamera = camera as PerspectiveCamera;

    if (perspectiveCamera.isPerspectiveCamera) {
      perspectiveCamera.aspect = renderer.canvasWidth / renderer.canvasHeight;
      perspectiveCamera.updateProjectionMatrix();
    }

    renderer.camera = camera;
  }
}
