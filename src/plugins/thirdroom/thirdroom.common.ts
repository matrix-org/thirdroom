export enum ThirdRoomMessageType {
  EnterWorld = "enter-world",
  ExitWorld = "exit-world",
  LoadEnvironment = "load-environment",
  EnvironmentLoaded = "environment-loaded",
  EnvironmentLoadError = "environment-load-error",
  PrintThreadState = "print-thread-state",
}

export interface EnterWorldMessage {
  type: ThirdRoomMessageType.EnterWorld;
}

export interface ExitWorldMessage {
  type: ThirdRoomMessageType.ExitWorld;
}

export interface LoadEnvironmentMessage {
  type: ThirdRoomMessageType.LoadEnvironment;
  id: number;
  url: string;
}

export interface EnvironmentLoadedMessage {
  type: ThirdRoomMessageType.EnvironmentLoaded;
  id: number;
  url: string;
}

export interface EnvironmentLoadErrorMessage {
  type: ThirdRoomMessageType.EnvironmentLoadError;
  id: number;
  url: string;
  error: string;
}

export interface PrintThreadStateMessage {
  type: ThirdRoomMessageType.PrintThreadState;
}
