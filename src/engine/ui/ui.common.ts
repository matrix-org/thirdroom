export enum WebSGUIMessage {
  DoneDrawing = "done-drawing",
}

export interface DoneDrawingUIMessage {
  type: WebSGUIMessage.DoneDrawing;
  eid: number;
}
