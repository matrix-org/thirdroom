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
}

export interface WorkerMessage {
  type: WorkerMessageType;
}

export interface InitializeGameWorkerMessage extends WorkerMessage {
  type: WorkerMessageType.InitializeGameWorker;
  inputTripleBuffer: TripleBufferState;
  renderWorkerMessageTarget: RenderWorkerMessageTarget;
}

export interface InitializeRenderWorkerMessage extends WorkerMessage {
  type: WorkerMessageType.InitializeRenderWorker;
  gameWorkerMessageTarget: GameWorkerMessageTarget;
  canvasTarget: HTMLCanvasElement | OffscreenCanvas;
  initialCanvasWidth: number;
  initialCanvasHeight: number;
}

export interface RenderWorkerResizeMessage extends WorkerMessage {
  type: WorkerMessageType.RenderWorkerResize;
  canvasWidth: number;
  canvasHeight: number;
}

export interface InitializeGameWorkerRenderStateMessage extends WorkerMessage {
  type: WorkerMessageType.InitializeGameWorkerRenderState;
  workerFrameRate: number;
  tripleBuffer: TripleBufferState;
  resourceManagerBuffer: SharedArrayBuffer;
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

export interface LoadResourceMessage extends WorkerMessage {
  type: WorkerMessageType.LoadResource;
  resourceId: number;
  resourceDef: ResourceDefinition;
}

export interface AddResourceRefMessage extends WorkerMessage {
  type: WorkerMessageType.AddResourceRef;
  resourceId: number;
}

export interface RemoveResourceRefMessage extends WorkerMessage {
  type: WorkerMessageType.RemoveResourceRef;
  resourceId: number;
}

export type WorkerMessages =
  | InitializeGameWorkerMessage
  | InitializeRenderWorkerMessage
  | RenderWorkerResizeMessage
  | InitializeGameWorkerRenderStateMessage
  | LoadedResourceMessage<any>
  | LoadErrorResourceMessage<any>
  | DisposedResourceMessage
  | LoadResourceMessage
  | AddResourceRefMessage
  | RemoveResourceRefMessage;

export type WorkerMessageTarget = {
  postMessage(
    message: WorkerMessages,
    transfer?: (Transferable | OffscreenCanvas)[]
  ): void;
};

export type RenderWorkerMessageTarget = (
  | MessagePort
  | typeof import("./RenderWorker")
) &
  WorkerMessageTarget;

export type GameWorkerMessageTarget = (MessagePort | Worker) &
  WorkerMessageTarget;
