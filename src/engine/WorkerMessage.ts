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
  ExportScene = "export-scene",
  ExportGLTF = "export-gltf",
  SaveGLTF = "save-gltf",
  ReliableNetworkMessage = "reliable-network-message",
  ReliableNetworkBroadcast = "reliable-network-broadcast",
  UnreliableNetworkMessage = "unreliable-network-message",
  UnreliableNetworkBroadcast = "unreliable-network-broadcast",
  SetPeerId = "set-peer-id",
  AddPeerId = "add-peer-id",
  RemovePeerId = "remove-peer-id",
  StateChanged = "state-changed",
  SetHost = "set-host",
  PlayAudio = "play-audio",
  SetAudioListener = "set-audio-listener",
  SetAudioPeerEntity = "set-audio-peer-entity",
}

export interface WorkerMessage<T extends WorkerMessageType = WorkerMessageType> {
  type: T;
}

export interface InitializeGameWorkerMessage extends WorkerMessage {
  type: WorkerMessageType.InitializeGameWorker;
  renderWorkerMessagePort?: MessagePort;
  mainToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  gameToRenderTripleBufferFlags: Uint8Array;
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
  gameWorkerMessageTarget: MessagePort;
  gameToRenderTripleBufferFlags: Uint8Array;
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

export interface ExportSceneMessage extends WorkerMessage {
  type: WorkerMessageType.ExportScene;
}

export interface SaveGLTFMessage extends WorkerMessage {
  type: WorkerMessageType.SaveGLTF;
  buffer: ArrayBuffer;
}

export interface StateChangedMessage extends WorkerMessage {
  type: WorkerMessageType.StateChanged;
  state: any;
}

export interface PlayAudioMessage extends WorkerMessage {
  type: WorkerMessageType.PlayAudio;
  filepath: string;
  eid: number;
}

export interface SetAudioListenerMessage extends WorkerMessage {
  type: WorkerMessageType.SetAudioListener;
  eid: number;
}

export interface SetAudioPeerEntityMessage extends WorkerMessage {
  type: WorkerMessageType.SetAudioPeerEntity;
  peerId: string;
  eid: number;
}

export type WorkerMessages =
  | InitializeGameWorkerMessage
  | InitializeRenderWorkerMessage
  | RenderWorkerResizeMessage
  | RenderWorkerInitializedMessage
  | StartRenderWorkerMessage
  | RenderWorkerErrorMessage
  | GameWorkerInitializedMessage
  | GameWorkerErrorMessage
  | StartGameWorkerMessage
  | ExportSceneMessage
  | SaveGLTFMessage
  | StateChangedMessage
  | PlayAudioMessage
  | SetAudioListenerMessage
  | SetAudioPeerEntityMessage;

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
