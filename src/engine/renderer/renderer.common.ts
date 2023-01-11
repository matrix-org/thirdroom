export const rendererModuleName = "renderer";

export enum RendererMessageType {
  InitializeCanvas = "renderer-initialize-canvas",
  InitializeRendererTripleBuffers = "initialize-renderer-triple-buffers",
  NotifySceneRendered = "renderer-notify-scene-renderer",
  SceneRenderedNotification = "renderer-scene-rendered-notification",
  CanvasResize = "canvas-resize",
  EnableMatrixMaterial = "enable-matrix-material",
}

export interface InitializeCanvasMessage {
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
