import { PerspectiveCamera, Quaternion, Vector3, Matrix4 } from "three";

import { swapReadBuffer, getReadBufferIndex } from "./allocator/TripleBuffer";
import { tickRate } from "./config.common";
import { onAddResourceRef, onLoadResource, onRemoveResourceRef } from "./resources/ResourceManager";
import {
  InitializeRenderWorkerMessage,
  WorkerMessages,
  WorkerMessageType,
  StartRenderWorkerMessage,
  RenderWorkerErrorMessage,
  RenderWorkerInitializedMessage,
} from "./WorkerMessage";
import { getModule, registerModules } from "./module/module.common";
import renderConfig from "./config.render";
import { StatsModule } from "./stats/stats.render";
import {
  onRenderableMessage,
  onResize,
  processRenderableMessages,
  RendererModule,
  RenderThreadState,
} from "./renderer/renderer.render";

let localEventTarget: EventTarget | undefined;

const isWorker = typeof (window as any) === "undefined";

if (isWorker) {
  self.window = self;
  globalThis.addEventListener("message", onMessage);
} else {
  localEventTarget = new EventTarget();
}

// outbound RenderThread -> MainThread
export function postToMainThread(data: any, transfer?: (Transferable | OffscreenCanvas)[]) {
  if (isWorker) {
    (globalThis as any).postMessage(data, transfer);
  } else {
    localEventTarget!.dispatchEvent(new MessageEvent("message", { data }));
  }
}

// inbound MainThread -> RenderThread
export default {
  postMessage: (data: any) => onMessage({ data }),
  addEventListener: (
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean
  ): void => localEventTarget!.addEventListener(type, callback, options),
  removeEventListener: (
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ): void => localEventTarget!.removeEventListener(type, callback, options),
};

let _state: RenderThreadState;

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

  const handlers = _state.messageHandlers.get(message.type);

  if (handlers) {
    for (const handler of handlers) {
      handler(_state, message as any);
    }
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
    case WorkerMessageType.RemoveRenderable:
    case WorkerMessageType.SetActiveCamera:
    case WorkerMessageType.SetActiveScene:
      onRenderableMessage(_state, message);
      break;
    case WorkerMessageType.LoadResource:
      onLoadResource(_state, message);
      break;
    case WorkerMessageType.AddResourceRef:
      onAddResourceRef(_state, message);
      break;
    case WorkerMessageType.RemoveResourceRef:
      onRemoveResourceRef(_state, message);
      break;
  }
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

async function onInit({
  canvasTarget,
  gameWorkerMessageTarget,
  initialCanvasWidth,
  initialCanvasHeight,
  initialRenderWorkerState,
}: InitializeRenderWorkerMessage): Promise<RenderThreadState> {
  gameWorkerMessageTarget.addEventListener("message", onMessage);

  if (gameWorkerMessageTarget instanceof MessagePort) {
    gameWorkerMessageTarget.start();
  }

  const state: RenderThreadState = {
    elapsed: performance.now(),
    dt: 0,
    gameWorkerMessageTarget,
    messageHandlers: new Map(),
    preSystems: [],
    postSystems: [],
    systems: new Map(),
    modules: new Map(),
  };

  await registerModules(
    {
      canvasTarget,
      gameWorkerMessageTarget,
      initialCanvasWidth,
      initialCanvasHeight,
      ...initialRenderWorkerState,
    },
    state,
    renderConfig.modules
  );

  console.log("RenderWorker initialized");

  return state;
}

function onStart(state: RenderThreadState, message: StartRenderWorkerMessage) {
  const { renderer } = getModule(state, RendererModule);
  renderer.setAnimationLoop(() => onUpdate(state));
}

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();

function onUpdate(state: RenderThreadState) {
  const renderModule = getModule(state, RendererModule);
  const {
    needsResize,
    renderer,
    canvasWidth,
    canvasHeight,
    renderableTripleBuffer,
    transformViews,
    renderableViews,
    renderables,
    scene,
    camera,
  } = renderModule;

  processRenderableMessages(state);

  const now = performance.now();
  const dt = (state.dt = now - state.elapsed);
  state.elapsed = now;
  const frameRate = 1 / dt;
  const lerpAlpha = clamp(tickRate / frameRate, 0, 1);

  const bufferSwapped = swapReadBuffer(renderableTripleBuffer);

  const bufferIndex = getReadBufferIndex(renderableTripleBuffer);
  const Transform = transformViews[bufferIndex];
  const Renderable = renderableViews[bufferIndex];

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

  if (needsResize && renderModule.camera.type === "PerspectiveCamera") {
    const perspectiveCamera = renderModule.camera as PerspectiveCamera;
    perspectiveCamera.aspect = canvasWidth / canvasHeight;
    perspectiveCamera.updateProjectionMatrix();
    renderer.setSize(canvasWidth, canvasHeight, false);
    renderModule.needsResize = false;
  }

  for (let i = 0; i < state.preSystems.length; i++) {
    state.preSystems[i](state);
  }

  renderer.render(scene, camera);

  for (let i = 0; i < renderConfig.systems.length; i++) {
    renderConfig.systems[i](state);
  }

  for (let i = 0; i < state.postSystems.length; i++) {
    state.postSystems[i](state);
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
