export enum ThirdRoomMessageType {
  EnterWorld = "enter-world",
  ExitWorld = "exit-world",
  LoadWorld = "load-world",
  WorldLoaded = "world-loaded",
  WorldLoadError = "world-load-error",
  PrintThreadState = "print-thread-state",
}

export interface EnterWorldMessage {
  type: ThirdRoomMessageType.EnterWorld;
}

export interface ExitWorldMessage {
  type: ThirdRoomMessageType.ExitWorld;
}

export interface LoadWorldMessage {
  type: ThirdRoomMessageType.LoadWorld;
  id: number;
  url: string;
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
