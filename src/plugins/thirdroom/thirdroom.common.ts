export enum ThirdRoomMessageType {
  EnterWorld = "enter-world",
  ExitWorld = "exit-world",
  LoadEnvironment = "load-environment",
}

export interface EnterWorldMessage {
  type: ThirdRoomMessageType.EnterWorld;
}

export interface ExitWorldMessage {
  type: ThirdRoomMessageType.ExitWorld;
}

export interface LoadEnvironmentMessage {
  type: ThirdRoomMessageType.LoadEnvironment;
  url: string;
}
