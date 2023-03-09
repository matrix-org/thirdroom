export enum CameraRigMessage {
  StopOrbit = "start-orbit",
  StartOrbit = "stop-orbit",
}

export interface StartOrbitMessage {
  type: CameraRigMessage.StartOrbit;
}

export interface StopOrbitMessage {
  type: CameraRigMessage.StopOrbit;
}
