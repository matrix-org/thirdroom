import { vec3 } from "gl-matrix";

import { RenderUIFlex } from "../resource/resource.render";

export enum WebSGUIMessage {
  DoneDrawing = "websgui-done-drawing",
  ButtonPress = "websgui-button-press",
  CanvasInteraction = "websgui-canvas-interaction",
}

export interface UIDoneDrawingMessage {
  type: WebSGUIMessage.DoneDrawing;
  uiCanvasEid: number;
}

export interface UICanvasInteractionMessage {
  type: WebSGUIMessage.CanvasInteraction;
  uiCanvasEid: number;
  hitPoint: vec3;
}

export interface UIButtonPressMessage {
  type: WebSGUIMessage.ButtonPress;
  buttonEid: number;
}

export function traverseUIFlex(node: RenderUIFlex, callback: (child: RenderUIFlex, index: number) => boolean | void) {
  let curChild = node.firstChild;
  let i = 0;

  while (curChild) {
    const continueTraversal = callback(curChild, i++) !== false;
    if (continueTraversal) {
      traverseUIFlex(curChild, callback);
      curChild = curChild.nextSibling;
    } else {
      return;
    }
  }
}
