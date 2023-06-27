import { vec3 } from "gl-matrix";

import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { InputRingBuffer } from "../common/InputRingBuffer";
import { XRInputLayout } from "./xr/WebXRInputProfiles";

export const rendererModuleName = "renderer";

export enum RendererMessageType {
  InitializeRenderer = "renderer-initialize-canvas",
  InitializeRendererTripleBuffers = "initialize-renderer-triple-buffers",
  NotifySceneRendered = "renderer-notify-scene-renderer",
  SceneRenderedNotification = "renderer-scene-rendered-notification",
  CanvasResize = "canvas-resize",
  EnableMatrixMaterial = "enable-matrix-material",
  EnterXR = "enter-xr",
  InitializeGameRendererTripleBuffer = "initialize-game-renderer-triple-buffer",
  TogglePhysicsDebug = "toggle-physics-debug",
  PhysicsEnableDebugRender = "physics-enable-debug-render",
  PhysicsDisableDebugRender = "physics-disable-debug-render",
  SetNodeOptimizationsEnabled = "set-node-optimizations-enabled",
  PrintRenderThreadState = "print-render-thread-state",
  UICanvasPress = "ui-canvas-press",
  UICanvasFocus = "ui-canvas-focus",
  UIButtonPress = "ui-button-press",
  UIButtonFocus = "ui-button-focus",
  UIButtonUnfocus = "ui-button-unfocus",
  UpdateXRInputSources = "update-xr-input-sources",
  SetXRReferenceSpace = "set-xr-reference-space",
}

export interface InitializeRendererMessage {
  supportedXRSessionModes: XRSessionMode[] | false;
  canvasTarget?: OffscreenCanvas;
  initialCanvasWidth: number;
  initialCanvasHeight: number;
  quality: RenderQuality;
  statsBuffer: RenderStatsBuffer;
  inputRingBuffer: InputRingBuffer;
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

export type PhysicsDebugRenderTripleBuffer = ObjectTripleBuffer<{
  size: [Uint32ArrayConstructor, number];
  vertices: [Float32ArrayConstructor, number];
  colors: [Float32ArrayConstructor, number];
}>;

export interface TogglePhysicsDebugMessage {
  type: RendererMessageType.TogglePhysicsDebug;
}

export interface PhysicsEnableDebugRenderMessage {
  type: RendererMessageType.PhysicsEnableDebugRender;
  tripleBuffer: PhysicsDebugRenderTripleBuffer;
}

export interface PhysicsDisableDebugRenderMessage {
  type: RendererMessageType.PhysicsDisableDebugRender;
}

export interface SetNodeOptimizationsEnabledMessage {
  type: RendererMessageType.SetNodeOptimizationsEnabled;
  enabled: boolean;
}

export interface PrintRenderThreadStateMessage {
  type: RendererMessageType.PrintRenderThreadState;
}

export interface UICanvasPressMessage {
  type: RendererMessageType.UICanvasPress;
  uiCanvasEid: number;
  hitPoint: vec3;
}

export interface UICanvasFocusMessage {
  type: RendererMessageType.UICanvasFocus;
  uiCanvasEid: number;
  hitPoint: vec3;
}

export interface UIButtonPressMessage {
  type: RendererMessageType.UIButtonPress;
  buttonEid: number;
}
export interface UIButtonFocusMessage {
  type: RendererMessageType.UIButtonFocus;
  buttonEid: number;
}
export interface UIButtonUnfocusMessage {
  type: RendererMessageType.UIButtonUnfocus;
}

export interface EnterXRMessage {
  type: RendererMessageType.EnterXR;
  session: XRSession;
  mode: XRSessionMode;
}

export interface SetXRReferenceSpaceMessage {
  type: RendererMessageType.SetXRReferenceSpace;
  hand: XRHandedness;
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

export enum RenderStats {
  fps,
  frameTime,
  frameDuration,
  frame,
  staleFrames,
  drawCalls,
  programs,
  geometries,
  textures,
  triangles,
  points,
  lines,
}

export interface RenderStatsBuffer {
  buffer: SharedArrayBuffer;
  f32: Float32Array;
  u32: Uint32Array;
}

export const RenderStatNames = Object.keys(RenderStats).filter((v) => isNaN(+v));

export const XRCameraPoseSchema = defineObjectBufferSchema({
  matrix: [Float32Array, 16],
});
export const XRControllerPosesSchema = defineObjectBufferSchema({
  rayPose: [Float32Array, 16],
  gripPose: [Float32Array, 16],
});

// https://www.w3.org/TR/webxr-hand-input-1/#skeleton-joints
export const XRHandPosesSchema = defineObjectBufferSchema({
  matrices: [Float32Array, 25, 16],
  radii: [Float32Array, 25],
});

export type XRCameraPoseTripleBuffer = ObjectTripleBuffer<typeof XRCameraPoseSchema>;
export type XRControllerPosesTripleBuffer = ObjectTripleBuffer<typeof XRControllerPosesSchema>;
export type XRHandPosesTripleBuffer = ObjectTripleBuffer<typeof XRHandPosesSchema>;

export interface SharedXRInputSource {
  id: number;
  handedness: XRHandedness;
  layout: XRInputLayout;
  cameraPose: XRCameraPoseTripleBuffer;
  controllerPoses: XRControllerPosesTripleBuffer;
  handPoses?: XRHandPosesTripleBuffer;
}

export interface UpdateXRInputSourcesMessage {
  type: RendererMessageType.UpdateXRInputSources;
  added: SharedXRInputSource[];
  removed: number[];
}
