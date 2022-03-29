import { OffscreenCanvas } from "three";
import { ResourceDefinition } from "./resources/ResourceManager";
import { TripleBufferState } from "./TripleBuffer";

export enum WorkerMessageType {
  InitializeGameWorker = "initialize-game-worker",
  InitializeRenderWorker = "initialize-render-worker",
  InitializeGameWorkerRenderState = "initialize-game-worker-render-state",
  RenderWorkerResize = "render-worker-resize",
  LoadResource = "load-resource",
  ResourceLoaded = "resource-loaded",
  ResourceLoadError = "resource-load-error",
  AddResourceRef = "add-resource-ref",
  RemoveResourceRef = "remove-resource-ref",
  ResourceDisposed = "resource-disposed",
  AddRenderable = "add-renderable",
  RemoveRenderable = "remove-renderable",
}

export interface WorkerMessage {
  type: WorkerMessageType;
}

export interface InitializeGameWorkerMessage extends WorkerMessage {
  type: WorkerMessageType.InitializeGameWorker;
  inputTripleBuffer: TripleBufferState;
  renderableTripleBuffer: TripleBufferState;
  renderWorkerMessagePort?: MessagePort;
  resourceManagerBuffer: SharedArrayBuffer;
}

export interface InitializeRenderWorkerMessage extends WorkerMessage {
  type: WorkerMessageType.InitializeRenderWorker;
  gameWorkerMessageTarget: GameWorkerMessageTarget;
  canvasTarget: HTMLCanvasElement | OffscreenCanvas;
  renderableTripleBuffer: TripleBufferState;
  resourceManagerBuffer: SharedArrayBuffer;
  initialCanvasWidth: number;
  initialCanvasHeight: number;
}

export interface RenderWorkerResizeMessage extends WorkerMessage {
  type: WorkerMessageType.RenderWorkerResize;
  canvasWidth: number;
  canvasHeight: number;
}

export interface LoadedResourceMessage<RemoteResource = undefined> extends WorkerMessage {
  type: WorkerMessageType.ResourceLoaded;
  resourceId: number;
  remoteResource?: RemoteResource;
}

export interface LoadErrorResourceMessage<Error> extends WorkerMessage {
  type: WorkerMessageType.ResourceLoadError;
  resourceId: number;
  error: Error;
}

export interface DisposedResourceMessage extends WorkerMessage {
  type: WorkerMessageType.ResourceDisposed;
  resourceId: number;
}

export interface LoadResourceMessage<Def extends ResourceDefinition> extends WorkerMessage {
  type: WorkerMessageType.LoadResource;
  resourceId: number;
  resourceDef: Def;
}

export interface AddResourceRefMessage extends WorkerMessage {
  type: WorkerMessageType.AddResourceRef;
  resourceId: number;
}

export interface RemoveResourceRefMessage extends WorkerMessage {
  type: WorkerMessageType.RemoveResourceRef;
  resourceId: number;
}

export interface AddRenderableMessage extends WorkerMessage {
  type: WorkerMessageType.AddRenderable;
  eid: number;
  resourceId: number;
}

export interface RemoveRenderableMessage extends WorkerMessage {
  type: WorkerMessageType.RemoveRenderable;
  eid: number;
}

export type WorkerMessages =
  | InitializeGameWorkerMessage
  | InitializeRenderWorkerMessage
  | RenderWorkerResizeMessage
  | LoadedResourceMessage<any>
  | LoadErrorResourceMessage<any>
  | DisposedResourceMessage
  | LoadResourceMessage<any>
  | AddResourceRefMessage
  | RemoveResourceRefMessage
  | AddRenderableMessage
  | RemoveRenderableMessage;

export type WorkerMessageTarget = {
  addEventListener(name: "message", listener: (event: { data: WorkerMessages }) => void): void;
  postMessage(
    message: WorkerMessages,
    transfer?: (Transferable | OffscreenCanvas)[]
  ): void;
};

export type RenderWorkerMessageTarget = {
  postMessage(
    message: WorkerMessages,
    transfer?: (Transferable | OffscreenCanvas)[]
  ): void;
};

export type GameWorkerMessageTarget = WorkerMessageTarget;
