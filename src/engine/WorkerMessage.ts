export enum WorkerMessageType {
  InitializeGameWorker = "initialize-game-worker",
  InitializeRenderWorker = "initialize-render-worker",
}

export interface InitializeGameWorkerMessage {
  type: WorkerMessageType.InitializeGameWorker;
  renderWorkerMessagePort?: MessagePort;
  renderToGameTripleBufferFlags: Uint8Array;
  mainToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  gameToRenderTripleBufferFlags: Uint8Array;
}

export interface InitializeRenderWorkerMessage {
  type: WorkerMessageType.InitializeRenderWorker;
  gameWorkerMessageTarget: MessagePort;
  renderToGameTripleBufferFlags: Uint8Array;
  gameToRenderTripleBufferFlags: Uint8Array;
}
