/*********
 * Types *
 ********/

export interface EditorNode {
  id: number;
  eid: number;
  name: string;
  children: EditorNode[];
}

/************
 * Messages *
 ************/

export enum EditorMessageType {
  LoadEditor = "load-editor",
  EditorLoaded = "editor-loaded",
  DisposeEditor = "dispose-editor",
}

export interface LoadEditorMessage {
  type: EditorMessageType.LoadEditor;
}

export interface EditorLoadedMessage {
  type: EditorMessageType.EditorLoaded;
  scene?: EditorNode;
}

export interface DisposeEditorMessage {
  type: EditorMessageType.DisposeEditor;
}
