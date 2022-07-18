/*********
 * Types *
 ********/

import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { hierarchyObjectBufferSchema } from "../component/transform.common";

export interface EditorNode {
  id: number;
  eid: number;
  name: string;
  children: EditorNode[];
}

export type HierarchyTripleBuffer = ObjectTripleBuffer<typeof hierarchyObjectBufferSchema>;

export const editorStateSchema = defineObjectBufferSchema({
  activeSceneEid: [Uint32Array, 1],
});

export type EditorStateTripleBuffer = ObjectTripleBuffer<typeof editorStateSchema>;

/************
 * Messages *
 ************/

export enum EditorMessageType {
  InitializeEditorState = "init-editor-state",
  LoadEditor = "load-editor",
  EditorLoaded = "editor-loaded",
  DisposeEditor = "dispose-editor",
  NamesChanged = "names-changed",
}

export interface InitializeEditorStateMessage {
  editorStateTripleBuffer: EditorStateTripleBuffer;
  hierarchyTripleBuffer: HierarchyTripleBuffer;
}

export interface LoadEditorMessage {
  type: EditorMessageType.LoadEditor;
}

export interface EditorLoadedMessage {
  type: EditorMessageType.EditorLoaded;
  names: Map<number, string>;
}

export interface DisposeEditorMessage {
  type: EditorMessageType.DisposeEditor;
}

export interface NamesChangedMessage {
  type: EditorMessageType.NamesChanged;
  created: [number, string][];
  updated: [number, string][];
  deleted: number[];
}
