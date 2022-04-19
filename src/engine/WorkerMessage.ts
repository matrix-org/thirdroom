import { OffscreenCanvas } from "three";

import { ResourceDefinition } from "./resources/ResourceManager";
import { TripleBufferState } from "./TripleBuffer";
import { GLTFEntityDescription } from "./gltf";

export enum WorkerMessageType {
  InitializeGameWorker = "initialize-game-worker",
  GameWorkerInitialized = "game-worker-initialized",
  GameWorkerError = "game-worker-error",
  InitializeRenderWorker = "initialize-render-worker",
  StartGameWorker = "start-game-worker",
  RenderWorkerInitialized = "render-worker-initialized",
  RenderWorkerError = "render-worker-error",
  StartRenderWorker = "start-render-worker",
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
  SetActiveCamera = "set-active-camera",
  SetActiveScene = "set-active-scene",
  ExportScene = "export-scene",
  ExportGLTF = "export-gltf",
  SaveGLTF = "save-gltf",
  ReliableNetworkMessage = "reliable-network-message",
  UnreliableNetworkMessage = "unreliable-network-message",
  SetPeerId = "set-peer-id",
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
  statsSharedArrayBuffer: SharedArrayBuffer;
}

export interface GameWorkerInitializedMessage extends WorkerMessage {
  type: WorkerMessageType.GameWorkerInitialized;
}

export interface StartGameWorkerMessage extends WorkerMessage {
  type: WorkerMessageType.StartGameWorker;
}

export interface GameWorkerErrorMessage extends WorkerMessage {
  type: WorkerMessageType.GameWorkerError;
  error: any;
}

export interface InitializeRenderWorkerMessage extends WorkerMessage {
  type: WorkerMessageType.InitializeRenderWorker;
  gameWorkerMessageTarget: PostMessageTarget;
  canvasTarget: HTMLCanvasElement | OffscreenCanvas;
  renderableTripleBuffer: TripleBufferState;
  resourceManagerBuffer: SharedArrayBuffer;
  initialCanvasWidth: number;
  initialCanvasHeight: number;
  statsSharedArrayBuffer: SharedArrayBuffer;
}

export interface RenderWorkerInitializedMessage extends WorkerMessage {
  type: WorkerMessageType.RenderWorkerInitialized;
}

export interface StartRenderWorkerMessage extends WorkerMessage {
  type: WorkerMessageType.StartRenderWorker;
}

export interface RenderWorkerErrorMessage extends WorkerMessage {
  type: WorkerMessageType.RenderWorkerError;
  error: any;
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

export interface SetActiveCameraMessage extends WorkerMessage {
  type: WorkerMessageType.SetActiveCamera;
  eid: number;
}

export interface SetActiveSceneMessage extends WorkerMessage {
  type: WorkerMessageType.SetActiveScene;
  eid: number;
  resourceId: number;
}

export interface ExportSceneMessage extends WorkerMessage {
  type: WorkerMessageType.ExportScene;
}

export interface ExportGLTFMessage extends WorkerMessage {
  type: WorkerMessageType.ExportGLTF;
  scene: GLTFEntityDescription;
}

export interface SaveGLTFMessage extends WorkerMessage {
  type: WorkerMessageType.SaveGLTF;
  buffer: ArrayBuffer;
}

export interface ReliableNetworkMessage extends WorkerMessage {
  type: WorkerMessageType.ReliableNetworkMessage;
  peerId: string;
  packet: ArrayBuffer;
}

export interface UnreliableNetworkMessage extends WorkerMessage {
  type: WorkerMessageType.UnreliableNetworkMessage;
  peerId: string;
  packet: ArrayBuffer;
}

export interface SetPeerIdMessage extends WorkerMessage {
  type: WorkerMessageType.SetPeerId;
  peerId: string;
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
  | RemoveRenderableMessage
  | RenderWorkerInitializedMessage
  | StartRenderWorkerMessage
  | RenderWorkerErrorMessage
  | GameWorkerInitializedMessage
  | GameWorkerErrorMessage
  | StartGameWorkerMessage
  | SetActiveCameraMessage
  | SetActiveSceneMessage
  | ExportSceneMessage
  | ExportGLTFMessage
  | SaveGLTFMessage
  | ReliableNetworkMessage
  | UnreliableNetworkMessage
  | SetPeerIdMessage;

export type RenderableMessages =
  | AddRenderableMessage
  | RemoveRenderableMessage
  | SetActiveCameraMessage
  | SetActiveSceneMessage;

export type MessagePortLike = MessagePort | LocalMessagePort;
export class LocalMessageChannel {
  public port1: LocalMessagePort;
  public port2: LocalMessagePort;

  constructor() {
    this.port1 = new LocalMessagePort(this, "port2");
    this.port2 = new LocalMessagePort(this, "port1");
  }
}

export class LocalMessagePort extends EventTarget {
  private messageChannel: LocalMessageChannel;
  private target: "port1" | "port2";

  constructor(messageChannel: LocalMessageChannel, target: "port1" | "port2") {
    super();
    this.messageChannel = messageChannel;
    this.target = target;
  }

  postMessage(message: any, transfer?: Array<Transferable | OffscreenCanvas>): void {
    this.messageChannel[this.target].dispatchEvent(new MessageEvent("message", { data: message }));
  }

  start() {}

  close() {}
}

export interface PostMessageTarget {
  postMessage(message: any, transfer?: Array<Transferable | OffscreenCanvas>): void;
  addEventListener(
    type: string,
    callback: ((message: any) => void) | null,
    options?: AddEventListenerOptions | boolean
  ): void;
  removeEventListener(
    type: string,
    callback: ((message: any) => void) | null,
    options?: EventListenerOptions | boolean
  ): void;
}
