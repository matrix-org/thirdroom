import { vec3 } from "gl-matrix";

export enum WebSGUIMessage {
  ButtonPress = "websgui-button-press",
  ButtonFocus = "websgui-button-focus",
  ButtonUnfocus = "websgui-button-unfocus",
  CanvasPress = "websgui-canvas-press",
  CanvasFocus = "websgui-canvas-focus",
}

// game -> render
export interface UICanvasPressMessage {
  type: WebSGUIMessage.CanvasPress;
  uiCanvasEid: number;
  hitPoint: vec3;
}

export interface UICanvasFocusMessage {
  type: WebSGUIMessage.CanvasFocus;
  uiCanvasEid: number;
  hitPoint: vec3;
}

// render -> game
export interface UIButtonPressMessage {
  type: WebSGUIMessage.ButtonPress;
  buttonEid: number;
}
export interface UIButtonFocusMessage {
  type: WebSGUIMessage.ButtonFocus;
  buttonEid: number;
}
export interface UIButtonUnfocusMessage {
  type: WebSGUIMessage.ButtonUnfocus;
}
