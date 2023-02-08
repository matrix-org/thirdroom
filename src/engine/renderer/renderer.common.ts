export const rendererModuleName = "renderer";

export enum RendererMessageType {
  InitializeCanvas = "renderer-initialize-canvas",
  InitializeRendererTripleBuffers = "initialize-renderer-triple-buffers",
  NotifySceneRendered = "renderer-notify-scene-renderer",
  SceneRenderedNotification = "renderer-scene-rendered-notification",
  CanvasResize = "canvas-resize",
  EnableMatrixMaterial = "enable-matrix-material",
  EnterXR = "enter-xr",
  InitializeGameRendererTripleBuffer = "initialize-game-renderer-triple-buffer",
}

export interface InitializeCanvasMessage {
  supportedXRSessionModes: XRSessionMode[] | false;
  canvasTarget?: OffscreenCanvas;
  initialCanvasWidth: number;
  initialCanvasHeight: number;
}

export interface NotifySceneRendererMessage {
  type: RendererMessageType.NotifySceneRendered;
  sceneResourceId: number;
  id: number;
  frames: number;
}

export interface SceneRenderedNotificationMessage {
  type: RendererMessageType.SceneRenderedNotification;
  id: number;
}

export interface CanvasResizeMessage {
  type: RendererMessageType.CanvasResize;
  canvasWidth: number;
  canvasHeight: number;
}

export interface EnableMatrixMaterialMessage {
  type: RendererMessageType.EnableMatrixMaterial;
  enabled: boolean;
}

export interface EnterXRMessage {
  type: RendererMessageType.EnterXR;
  session: XRSession;
  mode: XRSessionMode;
}

export enum XRMode {
  None,
  ImmersiveVR,
  ImmersiveAR,
}

export const XRSessionModeToXRMode: { [key: string]: XRMode } = {
  "immersive-vr": XRMode.ImmersiveVR,
  "immersive-ar": XRMode.ImmersiveAR,
};
