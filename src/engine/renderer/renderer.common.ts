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
  quality: RenderQuality;
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

export const LOCAL_STORAGE_RENDER_QUALITY = "render-quality";

export function gpuTierToRenderQuality(gpuTier: number) {
  switch (gpuTier) {
    case 0:
      return RenderQuality.Low;
    case 1:
      return RenderQuality.Low;
    case 2:
      return RenderQuality.Medium;
    case 3:
      return RenderQuality.High;
    default:
      return RenderQuality.Medium;
  }
}

export enum RenderQualitySetting {
  Auto = "auto",
  Low = "low",
  Medium = "medium",
  High = "high",
  Ultra = "ultra",
}

export const RenderQualityOptions: { label: string; value: RenderQualitySetting }[] = [
  {
    label: "Low",
    value: RenderQualitySetting.Low,
  },
  {
    label: "Medium",
    value: RenderQualitySetting.Medium,
  },
  {
    label: "High",
    value: RenderQualitySetting.High,
  },
  {
    label: "Ultra",
    value: RenderQualitySetting.Ultra,
  },
];

export enum RenderQuality {
  Low,
  Medium,
  High,
  Ultra,
}

export const RenderQualityToSetting = {
  [RenderQuality.Low]: RenderQualitySetting.Low,
  [RenderQuality.Medium]: RenderQualitySetting.Medium,
  [RenderQuality.High]: RenderQualitySetting.High,
  [RenderQuality.Ultra]: RenderQualitySetting.Ultra,
};
