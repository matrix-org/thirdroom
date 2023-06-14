export enum ThirdRoomMessageType {
  EnterWorld = "enter-world",
  EnteredWorld = "entered-world",
  EnterWorldError = "enter-world-error",
  ExitWorld = "exit-world",
  ExitedWorld = "exited-world",
  LoadWorld = "load-world",
  WorldLoaded = "world-loaded",
  WorldLoadError = "world-load-error",
  PrintThreadState = "print-thread-state",
  PrintResources = "print-resources",
  ReticleFocus = "reticle-focus",
  FindResourceRetainers = "find-resource-retainers",
  SetActionBarItems = "set-action-bar-items",
  SetObjectCap = "set-object-cap",
  ObjectCapReached = "object-cap-reached",
  ReloadWorld = "reload-world",
  ReloadedWorld = "reloaded-world",
  ReloadWorldError = "reload-world-error",
}

export interface EnterWorldMessage {
  type: ThirdRoomMessageType.EnterWorld;
  id: number;
  localPeerId?: string;
}

export interface EnteredWorldMessage {
  type: ThirdRoomMessageType.EnteredWorld;
  id: number;
}

export interface EnterWorldErrorMessage {
  type: ThirdRoomMessageType.EnterWorldError;
  id: number;
  error: string;
}

export interface ReloadWorldMessage {
  type: ThirdRoomMessageType.ReloadWorld;
  id: number;
  environmentUrl: string;
  options?: LoadWorldOptions;
}

export interface ReloadedWorldMessage {
  type: ThirdRoomMessageType.ReloadedWorld;
  id: number;
}

export interface ReloadWorldErrorMessage {
  type: ThirdRoomMessageType.ReloadWorldError;
  id: number;
  error: string;
}

export interface ExitWorldMessage {
  type: ThirdRoomMessageType.ExitWorld;
}

export interface ExitedWorldMessage {
  type: ThirdRoomMessageType.ExitedWorld;
}

export interface LoadWorldOptions {
  environmentScriptUrl?: string;
  maxObjectCap?: number;
  fileMap?: Map<string, string>;
}

export interface LoadWorldMessage {
  type: ThirdRoomMessageType.LoadWorld;
  id: number;
  environmentUrl: string;
  options?: LoadWorldOptions;
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

export interface PrintResourcesMessage {
  type: ThirdRoomMessageType.PrintResources;
}

export interface FindResourceRetainersMessage {
  type: ThirdRoomMessageType.FindResourceRetainers;
  resourceId: number;
}

export interface ActionBarItem {
  id: string;
  label: string;
  thumbnail: string;
  spawnable?: boolean;
}

export interface SetActionBarItemsMessage {
  type: ThirdRoomMessageType.SetActionBarItems;
  actionBarItems: ActionBarItem[];
}

export interface ObjectCapReachedMessage {
  type: ThirdRoomMessageType.ObjectCapReached;
}
export interface SetObjectCapMessage {
  type: ThirdRoomMessageType.SetObjectCap;
  value: number;
}
