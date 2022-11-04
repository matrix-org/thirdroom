export enum ThirdRoomMessageType {
  EnterWorld = "enter-world",
  ExitWorld = "exit-world",
  ExitedWorld = "exited-world",
  LoadWorld = "load-world",
  WorldLoaded = "world-loaded",
  WorldLoadError = "world-load-error",
  PrintThreadState = "print-thread-state",
  GLTFViewerLoadGLTF = "gltf-viewer-load-gltf",
  GLTFViewerLoaded = "gltf-viewer-loaded",
  GLTFViewerLoadError = "gltf-viewer-load-error",
  ReticleFocus = "reticle-focus",
}

export interface EnterWorldMessage {
  type: ThirdRoomMessageType.EnterWorld;
}

export interface ExitWorldMessage {
  type: ThirdRoomMessageType.ExitWorld;
}

export interface ExitedWorldMessage {
  type: ThirdRoomMessageType.ExitedWorld;
}

export interface LoadWorldMessage {
  type: ThirdRoomMessageType.LoadWorld;
  id: number;
  url: string;
  scriptUrl: string;
}

export interface WorldLoadedMessage {
  type: ThirdRoomMessageType.WorldLoaded;
  id: number;
  url: string;
}

export interface WorldLoadErrorMessage {
  type: ThirdRoomMessageType.WorldLoadError;
  id: number;
  url: string;
  error: string;
}

export interface PrintThreadStateMessage {
  type: ThirdRoomMessageType.PrintThreadState;
}

export interface GLTFViewerLoadGLTFMessage {
  type: ThirdRoomMessageType.GLTFViewerLoadGLTF;
  url: string;
  fileMap: Map<string, string>;
}

export interface GLTFViewerLoadedMessage {
  type: ThirdRoomMessageType.GLTFViewerLoaded;
  url: string;
}

export interface GLTFViewerLoadErrorMessage {
  type: ThirdRoomMessageType.GLTFViewerLoadError;
  error: string;
}
