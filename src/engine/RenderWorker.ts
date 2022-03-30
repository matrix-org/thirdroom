import { createCursorBuffer, addView, addViewMatrix4 } from "./allocator/CursorBuffer";
import { swapReadBuffer, getReadBufferIndex } from "./TripleBuffer";
import { maxEntities, tickRate } from './config';
import {
  AmbientLight,
  WebGLRenderer,
  Scene,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Clock,
  Vector3,
  Matrix4,
} from "three";
import { createResourceManager, onAddResourceRef, onLoadResource, onRemoveResourceRef, registerResourceLoader, ResourceManager } from "./resources/ResourceManager";
import { GLTFResourceLoader } from "./resources/GLTFResourceLoader";
import { MeshResourceLoader } from "./resources/MeshResourceLoader";
import { MaterialResourceLoader } from "./resources/MaterialResourceLoader";
import { GeometryResourceLoader } from "./resources/GeometryResourceLoader";
import { CameraResourceLoader } from "./resources/CameraResourceLoader";
import { AddRenderableMessage, InitializeRenderWorkerMessage, RemoveRenderableMessage, RenderWorkerResizeMessage, WorkerMessages, WorkerMessageType, StartRenderWorkerMessage, RenderWorkerErrorMessage, RenderWorkerInitializedMessage } from "./WorkerMessage";
import { TripleBufferState } from "./TripleBuffer";

let localEventTarget: EventTarget | undefined;

const isWorker = typeof (window as any) === "undefined";

if (isWorker) {
  self.window = self;
  globalThis.addEventListener("message", onMessage);
} else {
  localEventTarget = new EventTarget();
  localEventTarget.addEventListener("message", onMessage);
}

// outbound RenderThread -> MainThread
function postToMainThread(data: any, transfer?: (Transferable | OffscreenCanvas)[]) {
  if (isWorker) {
    (globalThis as any).postMessage(data, transfer);
  } else {
    localEventTarget!.dispatchEvent(new MessageEvent("message", { data }))
  }
}

// inbound MainThread -> RenderThread
export default {
  postMessage: (data: any) => onMessage(data),
  addEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void => localEventTarget!.addEventListener(type, callback, options),
  removeEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void => localEventTarget!.removeEventListener(type, callback, options),
};

interface TransformView {
  worldMatrix: Float32Array[]
  worldMatrixNeedsUpdate: Uint8Array
  interpolate: Uint8Array
}

interface Renderable {
  object: Object3D;
  eid: number;
}

interface RenderWorkerState {
  needsResize: boolean,
  canvasWidth: number,
  canvasHeight: number,
  scene: Object3D;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  clock: Clock;
  resourceManager: ResourceManager;
  addRenderableQueue: AddRenderableMessage[];
  removeRenderableQueue: RemoveRenderableMessage[];
  renderables: Renderable[];
  renderableIndices: Map<number, number>;
  renderableTripleBuffer: TripleBufferState;
  transformViews: TransformView[];
}

let _state: RenderWorkerState;

function onMessage({ data }: any) {
  if (typeof data !== "object") {
    return;
  }

  const message = data as WorkerMessages;

  if (message.type === WorkerMessageType.InitializeRenderWorker) {
    onInit(message)
      .then((s) => {
        _state = s;
        postToMainThread({ type: WorkerMessageType.RenderWorkerInitialized } as RenderWorkerInitializedMessage);
      })
      .catch((error) => {
        console.error(error);
        postToMainThread({ type: WorkerMessageType.RenderWorkerError, error } as RenderWorkerErrorMessage);
      });
    return;
  }

  if (!_state) {
    console.warn(`Render worker not initialized before processing ${message.type}`);
    return;
  }

  switch (message.type) {
    case WorkerMessageType.StartRenderWorker:
      onStart(_state, message);
      break;
    case WorkerMessageType.RenderWorkerResize:
      onResize(_state, message);
      break;
    case WorkerMessageType.AddRenderable: 
      onAddRenderable(_state, message);
      break;
    case WorkerMessageType.RemoveRenderable:
      onRemoveRenderable(_state, message);
      break;
    case WorkerMessageType.LoadResource:
      onLoadResource(_state.resourceManager, message);
      break;
    case WorkerMessageType.AddResourceRef:
      onAddResourceRef(_state.resourceManager, message);
      break;
    case WorkerMessageType.RemoveResourceRef:
      onRemoveResourceRef(_state.resourceManager, message);
      break;
  }
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

async function onInit({
  canvasTarget,
  gameWorkerMessageTarget,
  initialCanvasWidth,
  initialCanvasHeight,
  resourceManagerBuffer,
  renderableTripleBuffer,
}: InitializeRenderWorkerMessage): Promise<RenderWorkerState> {

  gameWorkerMessageTarget.addEventListener("message", onMessage);

  if (gameWorkerMessageTarget instanceof MessagePort) {
    gameWorkerMessageTarget.start();
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera(70, initialCanvasWidth / initialCanvasHeight, 0.1, 1000);
  camera.position.z = 5;

  const resourceManager = createResourceManager(resourceManagerBuffer, gameWorkerMessageTarget);
  registerResourceLoader(resourceManager, GeometryResourceLoader);
  registerResourceLoader(resourceManager, MaterialResourceLoader);
  registerResourceLoader(resourceManager, MeshResourceLoader);
  registerResourceLoader(resourceManager, CameraResourceLoader);
  registerResourceLoader(resourceManager, GLTFResourceLoader);

  scene.add(new AmbientLight(0xffffff, 0.5));

  // TODO: Send scene/camera resource ids to the GameWorker

  const renderer = new WebGLRenderer({ antialias: true, canvas: canvasTarget });

  const clock = new Clock();

  const transformViews = renderableTripleBuffer.views
    .map(buffer => createCursorBuffer(buffer))
    .map(buffer => ({
      // note: needs synced with renderableBuffer properties in game worker
      // todo: abstract the need to sync structure with renderableBuffer properties
      worldMatrix: addViewMatrix4(buffer, maxEntities),
      worldMatrixNeedsUpdate: addView(buffer, Uint8Array, maxEntities),
      interpolate: addView(buffer, Uint8Array, maxEntities)
    }) as TransformView);

  const state: RenderWorkerState = {
    needsResize: true,
    camera,
    scene,
    renderer,
    clock,
    resourceManager,
    canvasWidth: initialCanvasWidth,
    canvasHeight: initialCanvasWidth,
    addRenderableQueue: [],
    removeRenderableQueue: [],
    renderables: [],
    renderableIndices: new Map<number,number>(),
    renderableTripleBuffer,
    transformViews,
  };

  console.log("RenderWorker initialized");

  return state;
}

function onStart(state: RenderWorkerState, message: StartRenderWorkerMessage) {
  state.renderer.setAnimationLoop(() => onUpdate(state));
}

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();

function onUpdate({
  clock,
  needsResize,
  camera,
  scene,
  renderer,
  canvasWidth,
  canvasHeight,
  renderableTripleBuffer,
  transformViews,
  resourceManager,
  addRenderableQueue,
  removeRenderableQueue,
  renderables,
  renderableIndices,
}: RenderWorkerState) {
  const dt = clock.getDelta();
  const frameRate = 1 / dt;
  const lerpAlpha = clamp(tickRate / frameRate, 0 , 1);

  while (addRenderableQueue.length) {
    const { eid, resourceId } = addRenderableQueue.shift()!;
    const object = resourceManager.store.get(resourceId)!.resource as Object3D;
    renderableIndices.set(eid, renderables.length);
    renderables.push({ object, eid });
    scene.add(object);
  }

  while (removeRenderableQueue.length) {
    const { eid } = removeRenderableQueue.shift()!;
    const index = renderableIndices.get(eid)!;
    const removed = renderables.splice(index, 1);
    renderableIndices.delete(eid);
    scene.remove(removed[0].object);
  }

  swapReadBuffer(renderableTripleBuffer);

  const bufferIndex = getReadBufferIndex(renderableTripleBuffer);
  const Transform = transformViews[bufferIndex];

  for (let i = 0; i < renderables.length; i++) {
    const { object, eid } = renderables[i];

    if (!Transform.worldMatrixNeedsUpdate[eid]) {
      continue;
    }

    if (Transform.interpolate[eid]) {
      tempMatrix4
        .fromArray(Transform.worldMatrix[eid])
        .decompose(tempPosition, tempQuaternion, tempScale);
      object.position.lerp(tempPosition, lerpAlpha);
      object.quaternion.slerp(tempQuaternion, lerpAlpha);
      object.scale.lerp(tempScale, lerpAlpha);
    } else {
      tempMatrix4
        .fromArray(Transform.worldMatrix[eid])
        .decompose(object.position, object.quaternion, object.scale);
      object.matrix.fromArray(Transform.worldMatrix[eid]);
      object.matrixWorld.fromArray(Transform.worldMatrix[eid]);
      object.matrixWorldNeedsUpdate = false;
    }
  }

  if (needsResize) {
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasWidth, canvasHeight, false);
  }

  renderer.render(scene, camera);
}

function onResize(state: RenderWorkerState, { canvasWidth, canvasHeight }: RenderWorkerResizeMessage) {
  state.needsResize = true;
  state.canvasWidth = canvasWidth;
  state.canvasHeight = canvasHeight;
}

function onAddRenderable({ addRenderableQueue }: RenderWorkerState, message: AddRenderableMessage) {
  addRenderableQueue.push(message);
}

function onRemoveRenderable({ removeRenderableQueue }: RenderWorkerState, message: RemoveRenderableMessage) {
  removeRenderableQueue.push(message);
}
