import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";

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

export const editorStateSchema = defineObjectBufferSchema({
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
  SelectionChanged = "selection-changed",
  ToggleSelectedEntity = "toggle-selected-entity",
  SetSelectedEntity = "set-selected-entity",
  AddSelectedEntity = "add-selected-entity",
  FocusEntity = "focus-entity",
  RenameEntity = "rename-entity",
  ReparentEntities = "reparent-entities",
  SetProperty = "set-property",
  SetTextureProperty = "set-texture-property",
}

export interface InitializeEditorStateMessage {
  editorStateTripleBuffer: EditorStateTripleBuffer;
}

export interface LoadEditorMessage {
  type: EditorMessageType.LoadEditor;
}

export interface EditorLoadedMessage {
  type: EditorMessageType.EditorLoaded;
  activeEntity: number;
  selectedEntities: number[];
}

export interface DisposeEditorMessage {
  type: EditorMessageType.DisposeEditor;
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

export interface SetPropertyMessage<T = unknown> {
  type: EditorMessageType.SetProperty;
  eid: number;
  propName: string;
  value: T;
}
export interface SetTexturePropertyMessage {
  type: EditorMessageType.SetTextureProperty;
  eid: number;
  propName: string;
  textureEid: number;
}
