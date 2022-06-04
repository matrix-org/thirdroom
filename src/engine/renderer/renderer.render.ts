import {
  ACESFilmicToneMapping,
  Camera,
  Matrix4,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Quaternion,
  Scene,
  sRGBEncoding,
  Vector3,
  WebGLRenderer,
} from "three";

import { getReadObjectBufferView, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { swapReadBufferFlags, TripleBuffer } from "../allocator/TripleBuffer";
import { CameraType } from "../camera/camera.common";
import { getLocalCameraResource } from "../camera/camera.render";
import { renderableSchema } from "../component/renderable.common";
import { clamp } from "../component/transform";
import { worldMatrixObjectBufferSchema } from "../component/transform.common";
import { tickRate } from "../config.common";
import { GLTFResourceLoader } from "../gltf/GLTFResourceLoader";
import { BaseThreadContext, defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { GeometryResourceLoader } from "../resources/GeometryResourceLoader";
import { MaterialResourceLoader } from "../resources/MaterialResourceLoader";
import { MeshResourceLoader } from "../resources/MeshResourceLoader";
import {
  createResourceManager,
  createResourceManagerBuffer,
  onAddResourceRef,
  onLoadResource,
  onRemoveResourceRef,
  registerResourceLoader,
  ResourceManager,
  ResourceState,
} from "../resources/ResourceManager";
import { getLocalSceneResource, SceneModule } from "../scene/scene.render";
import { StatsBuffer } from "../stats/stats.common";
import { StatsModule } from "../stats/stats.render";
import {
  AddRenderableMessage,
  PostMessageTarget,
  RemoveRenderableMessage,
  RenderableMessages,
  RenderWorkerResizeMessage,
  WorkerMessageType,
} from "../WorkerMessage";
import {
  InitializeCanvasMessage,
  InitializeRendererTripleBuffersMessage,
  RendererMessageType,
  rendererModuleName,
  rendererSchema,
} from "./renderer.common";

export interface TransformView {
  worldMatrix: Float32Array[];
  worldMatrixNeedsUpdate: Uint8Array;
}

export interface RenderableView {
  resourceId: Uint32Array;
  interpolate: Uint8Array;
  visible: Uint8Array;
}

export interface Renderable {
  object?: Object3D;
  helper?: Object3D;
  eid: number;
  resourceId: number;
}

export type RenderThreadSystem = (state: RenderThreadState) => void;

export interface IInitialRenderThreadState {
  statsBuffer: StatsBuffer;
  resourceManagerBuffer: SharedArrayBuffer;
  renderableTripleBuffer: TripleBuffer;
  gameWorkerMessageTarget: MessagePort;
  initialCanvasWidth: number;
  initialCanvasHeight: number;
  canvasTarget: HTMLElement;
}

export interface RenderThreadState extends BaseThreadContext {
  canvas?: HTMLCanvasElement;
  elapsed: number;
  dt: number;
  gameWorkerMessageTarget: PostMessageTarget;
  gameToRenderTripleBufferFlags: Uint8Array;
}

interface RendererModuleState {
  needsResize: boolean;
  canvasWidth: number;
  canvasHeight: number;
  renderer: WebGLRenderer;
  resourceManager: ResourceManager;
  renderableMessageQueue: RenderableMessages[];
  renderables: Renderable[];
  objectToEntityMap: Map<Object3D, number>;
  renderableIndices: Map<number, number>;
  sharedRendererState: TripleBufferBackedObjectBufferView<typeof rendererSchema, ArrayBuffer>;
  renderableObjectTripleBuffer: TripleBufferBackedObjectBufferView<typeof renderableSchema, ArrayBuffer>;
  worldMatrixObjectTripleBuffer: TripleBufferBackedObjectBufferView<typeof worldMatrixObjectBufferSchema, ArrayBuffer>;
}

export const RendererModule = defineModule<RenderThreadState, RendererModuleState>({
  name: rendererModuleName,
  async create(ctx, { sendMessage, waitForMessage }) {
    const { canvasTarget, initialCanvasHeight, initialCanvasWidth } = await waitForMessage<InitializeCanvasMessage>(
      Thread.Main,
      RendererMessageType.InitializeCanvas
    );

    const resourceManagerBuffer = createResourceManagerBuffer();

    sendMessage(Thread.Game, RendererMessageType.InitializeResourceManager, {
      resourceManagerBuffer,
    });

    const resourceManager = createResourceManager(resourceManagerBuffer);
    registerResourceLoader(resourceManager, GeometryResourceLoader);
    registerResourceLoader(resourceManager, MaterialResourceLoader);
    registerResourceLoader(resourceManager, MeshResourceLoader);
    registerResourceLoader(resourceManager, GLTFResourceLoader);

    const renderer = new WebGLRenderer({ antialias: true, canvas: canvasTarget || ctx.canvas });
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.setSize(initialCanvasWidth, initialCanvasHeight, false);

    const { sharedRendererState, renderableObjectTripleBuffer, worldMatrixObjectTripleBuffer } =
      await waitForMessage<InitializeRendererTripleBuffersMessage>(
        Thread.Game,
        RendererMessageType.InitializeRendererTripleBuffers
      );

    return {
      needsResize: true,
      renderer,
      resourceManager,
      canvasWidth: initialCanvasWidth,
      canvasHeight: initialCanvasHeight,
      renderableMessageQueue: [],
      objectToEntityMap: new Map(),
      renderables: [],
      renderableIndices: new Map<number, number>(),
      sharedRendererState,
      renderableObjectTripleBuffer,
      worldMatrixObjectTripleBuffer,
    };
  },
  init(ctx) {
    registerMessageHandler(ctx, WorkerMessageType.RenderWorkerResize, onResize);
    registerMessageHandler(ctx, WorkerMessageType.AddRenderable, onRenderableMessage);
    registerMessageHandler(ctx, WorkerMessageType.RemoveRenderable, onRenderableMessage);
    registerMessageHandler(ctx, WorkerMessageType.LoadResource, onLoadResource as any);
    registerMessageHandler(ctx, WorkerMessageType.AddResourceRef, onAddResourceRef);
    registerMessageHandler(ctx, WorkerMessageType.RemoveResourceRef, onRemoveResourceRef);
  },
});

export function startRenderLoop(state: RenderThreadState) {
  const { renderer } = getModule(state, RendererModule);
  renderer.setAnimationLoop(() => onUpdate(state));
}

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();

function onUpdate(state: RenderThreadState) {
  const bufferSwapped = swapReadBufferFlags(state.gameToRenderTripleBufferFlags);

  const renderModule = getModule(state, RendererModule);
  const {
    needsResize,
    renderer,
    canvasWidth,
    canvasHeight,
    renderables,
    renderableObjectTripleBuffer,
    worldMatrixObjectTripleBuffer,
  } = renderModule;

  processRenderableMessages(state);

  const now = performance.now();
  const dt = (state.dt = now - state.elapsed);
  state.elapsed = now;
  const frameRate = 1 / dt;
  const lerpAlpha = clamp(tickRate / frameRate, 0, 1);

  const Transform = getReadObjectBufferView(worldMatrixObjectTripleBuffer);
  const Renderable = getReadObjectBufferView(renderableObjectTripleBuffer);
  const sharedRendererState = getReadObjectBufferView(renderModule.sharedRendererState);

  renderableObjectTripleBuffer.views;

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

  const sceneEid = sharedRendererState.scene[0];
  const sceneResource = getLocalSceneResource(state, sceneEid);

  const cameraEid = sharedRendererState.camera[0];
  const cameraResource = getLocalCameraResource(state, cameraEid);

  if (cameraResource && needsResize) {
    const perspectiveCamera = cameraResource.camera as PerspectiveCamera;

    if (cameraResource.type === CameraType.Perspective && cameraResource.sharedCamera.aspectRatio[0] === 0) {
      perspectiveCamera.aspect = canvasWidth / canvasHeight;
    }

    perspectiveCamera.updateProjectionMatrix();

    renderer.setSize(canvasWidth, canvasHeight, false);
    renderModule.needsResize = false;
  }

  if (sceneResource && cameraResource) {
    renderModule.renderer.render(sceneResource.scene, cameraResource.camera);
  }

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

function onRenderableMessage(state: RenderThreadState, message: any) {
  const { renderableMessageQueue } = getModule(state, RendererModule);
  renderableMessageQueue.push(message);
}

function processRenderableMessages(state: RenderThreadState) {
  const { renderableMessageQueue } = getModule(state, RendererModule);
  while (renderableMessageQueue.length) {
    const message = renderableMessageQueue.shift() as RenderableMessages;

    switch (message.type) {
      case WorkerMessageType.AddRenderable:
        onAddRenderable(state, message);
        break;
      case WorkerMessageType.RemoveRenderable:
        onRemoveRenderable(state, message);
        break;
    }
  }
}

function onAddRenderable(state: RenderThreadState, message: AddRenderableMessage) {
  const { resourceId, eid } = message;
  const {
    renderableMessageQueue,
    renderableIndices,
    renderables,
    objectToEntityMap,
    resourceManager,
    sharedRendererState,
  } = getModule(state, RendererModule);

  const sceneEid = sharedRendererState.scene[0];
  const sceneModule = getModule(state, SceneModule);
  const sceneResource = sceneModule.sceneResources.get(sceneEid);

  if (!sceneResource) {
    console.warn("AddRenderable Error: scene not loaded");
    return;
  }

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
        sceneResource.scene.remove(removed[0].object);
      }
    } else {
      renderableIndex = renderables.length;
      renderableIndices.set(eid, renderables.length);
      renderables.push({ object, eid, resourceId });
      objectToEntityMap.set(object, eid);
    }

    sceneResource.scene.add(object);

    return;
  }

  if (resourceInfo.state === ResourceState.Loading) {
    if (renderableIndex !== undefined) {
      // Update the renderable with the new resource id and remove the old object
      const removed = renderables.splice(renderableIndex, 1, { object: undefined, eid, resourceId });

      if (removed.length > 0 && removed[0].object) {
        // Remove the previous renderable object from the scene if it exists
        sceneResource.scene.remove(removed[0].object);
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
  const { renderableIndices, renderables, objectToEntityMap, sharedRendererState } = getModule(state, RendererModule);

  const sceneEid = sharedRendererState.scene[0];
  const sceneModule = getModule(state, SceneModule);
  const sceneResource = sceneModule.sceneResources.get(sceneEid);

  if (!sceneResource) {
    console.warn("AddRenderable Error: scene not loaded");
    return;
  }

  const index = renderableIndices.get(eid);

  if (index !== undefined) {
    const removed = renderables.splice(index, 1);
    renderableIndices.delete(eid);

    if (removed.length > 0) {
      const { object, helper } = removed[0];

      if (object) {
        sceneResource.scene.remove(object);
        objectToEntityMap.delete(object);
      }

      if (helper) {
        sceneResource.scene.remove(helper);
        objectToEntityMap.delete(helper);
      }
    }
  }
}

export function getRendererActiveSceneEntity(ctx: RenderThreadState): number {
  const rendererModule = getModule(ctx, RendererModule);
  return rendererModule.sharedRendererState.scene[0];
}

export function getRendererActiveScene(ctx: RenderThreadState): Scene | undefined {
  const eid = getRendererActiveSceneEntity(ctx);
  const sceneResource = getLocalSceneResource(ctx, eid);
  return sceneResource?.scene;
}

export function getRendererActiveCameraEntity(ctx: RenderThreadState): number {
  const rendererModule = getModule(ctx, RendererModule);
  return rendererModule.sharedRendererState.camera[0];
}

export function getRendererActiveCamera(ctx: RenderThreadState): Camera | undefined {
  const eid = getRendererActiveCameraEntity(ctx);
  const sceneResource = getLocalCameraResource(ctx, eid);
  return sceneResource?.camera;
}
