import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { hierarchyObjectBufferSchema } from "../component/transform.common";

/*********
 * Types *
 ********/

export interface EditorNode {
  id: number;
  eid: number;
  name: string;
  children: EditorNode[];
}

export enum ReparentEntityPosition {
  Root = "root",
  Before = "before",
  After = "after",
  On = "on",
}

export type HierarchyTripleBuffer = ObjectTripleBuffer<typeof hierarchyObjectBufferSchema>;

export const editorStateSchema = defineObjectBufferSchema({
  activeSceneEid: [Uint32Array, 1],
  activeEntity: [Uint32Array, 1],
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
  SelectionChanged = "selection-changed",
  ToggleSelectedEntity = "toggle-selected-entity",
  SetSelectedEntity = "set-selected-entity",
  AddSelectedEntity = "add-selected-entity",
  FocusEntity = "focus-entity",
  RenameEntity = "rename-entity",
  ReparentEntities = "reparent-entities",
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
  activeEntity: number;
  selectedEntities: number[];
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

export interface SelectionChangedMessage {
  type: EditorMessageType.SelectionChanged;
  activeEntity: number;
  selectedEntities: number[];
}

export interface ToggleSelectedEntityMessage {
  type: EditorMessageType.ToggleSelectedEntity;
  eid: number;
}

export interface SetSelectedEntityMessage {
  type: EditorMessageType.SetSelectedEntity;
  eid: number;
}

export interface AddSelectedEntityMessage {
  type: EditorMessageType.AddSelectedEntity;
  eid: number;
}

export interface FocusEntityMessage {
  type: EditorMessageType.FocusEntity;
  eid: number;
}

export interface RenameEntityMessage {
  type: EditorMessageType.RenameEntity;
  eid: number;
  name: string;
}

export interface ReparentEntitiesMessage {
  type: EditorMessageType.ReparentEntities;
  entities: number[];
  target: number | undefined;
  position: ReparentEntityPosition;
}
