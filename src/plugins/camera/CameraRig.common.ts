export enum CameraRigMessage {
  RequestPointerLock = "request-pointer-lock",
  ExitPointerLock = "exit-pointer-lock",
}

export interface RequestPointerLockMessage {
  type: CameraRigMessage.RequestPointerLock;
}

export interface ExitPointerLockMessage {
  type: CameraRigMessage.ExitPointerLock;
}
