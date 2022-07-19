import EventEmitter from "events";

import {
  AddSelectedEntityMessage,
  DisposeEditorMessage,
  EditorLoadedMessage,
  EditorMessageType,
  EditorNode,
  EditorStateTripleBuffer,
  FocusEntityMessage,
  HierarchyTripleBuffer,
  InitializeEditorStateMessage,
  LoadEditorMessage,
  NamesChangedMessage,
  RenameEntityMessage,
  ReparentEntitiesMessage,
  ReparentEntityPosition,
  SelectionChangedMessage,
  SetSelectedEntityMessage,
  ToggleSelectedEntityMessage,
} from "./editor.common";
import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { NOOP } from "../config.common";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  names: Map<number, string>;
  activeEntity: number;
  selectedEntities: number[];
  editorStateTripleBuffer: EditorStateTripleBuffer;
  hierarchyTripleBuffer: HierarchyTripleBuffer;
  eventEmitter: EventEmitter;
  editorLoaded: boolean;
}

/************************
 * Editor Event Types *
 ************************/

export enum EditorEventType {
  EditorLoaded = "editor-loaded",
  HierarchyChanged = "hierarchy-changed",
  SelectionChanged = "selection-changed",
}

export interface EditorLoadedEvent {
  activeEntity: number;
  selectedEntities: number[];
}

export interface HierarchyChangedEvent {
  activeEntity: number;
  selectedEntities: number[];
  scene?: EditorNode;
}

export interface SelectionChangedEvent {
  activeEntity: number;
  selectedEntities: number[];
}

/******************
 * Initialization *
 ******************/

// Access module-specific state by importing this context in your systems, modules, or React components
export const EditorModule = defineModule<IMainThreadContext, EditorModuleState>({
  name: "editor",
  async create(ctx, { waitForMessage }) {
    const { editorStateTripleBuffer, hierarchyTripleBuffer } = await waitForMessage<InitializeEditorStateMessage>(
      Thread.Game,
      EditorMessageType.InitializeEditorState
    );

    return {
      names: new Map(),
      activeEntity: NOOP,
      selectedEntities: [],
      editorStateTripleBuffer,
      hierarchyTripleBuffer,
      eventEmitter: new EventEmitter(),
      editorLoaded: false,
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, EditorMessageType.EditorLoaded, onEditorLoaded),
      registerMessageHandler(ctx, EditorMessageType.NamesChanged, onNamesChanged),
      registerMessageHandler(ctx, EditorMessageType.SelectionChanged, onSelectionChanged),
    ]);
  },
});

/***********
 * Systems *
 ***********/

export function MainThreadEditorSystem(mainThread: IMainThreadContext) {
  const editor = getModule(mainThread, EditorModule);

  if (!editor.editorLoaded) {
    return;
  }

  updateHierarchy(editor);
}

function updateHierarchy(editor: EditorModuleState) {
  const editorStateView = getReadObjectBufferView(editor.editorStateTripleBuffer);

  const activeScene = editorStateView.activeSceneEid[0];

  const hierarchyView = getReadObjectBufferView(editor.hierarchyTripleBuffer);

  const scene = buildEditorNode(editor.names, hierarchyView, activeScene);

  const event: HierarchyChangedEvent = {
    scene,
    activeEntity: editor.activeEntity,
    selectedEntities: editor.selectedEntities,
  };

  editor.eventEmitter.emit(EditorEventType.HierarchyChanged, event);
}

/********************
 * Message Handlers *
 ********************/

function onEditorLoaded(ctx: IMainThreadContext, message: EditorLoadedMessage) {
  const editor = getModule(ctx, EditorModule);
  editor.editorLoaded = true;
  editor.names = message.names;
  editor.selectedEntities = message.selectedEntities;
  editor.activeEntity = message.activeEntity;

  const event: EditorLoadedEvent = {
    selectedEntities: message.selectedEntities,
    activeEntity: message.activeEntity,
  };
  editor.eventEmitter.emit(EditorEventType.EditorLoaded, event);
}

function onNamesChanged(ctx: IMainThreadContext, { created, updated, deleted }: NamesChangedMessage) {
  const editor = getModule(ctx, EditorModule);

  for (let i = 0; i < created.length; i++) {
    const [eid, name] = created[i];
    editor.names.set(eid, name);
  }

  for (let i = 0; i < updated.length; i++) {
    const [eid, name] = updated[i];
    editor.names.set(eid, name);
  }

  for (let i = 0; i < deleted.length; i++) {
    const eid = deleted[i];
    editor.names.delete(eid);
  }

  updateHierarchy(editor);
}

function onSelectionChanged(ctx: IMainThreadContext, message: SelectionChangedMessage) {
  const editor = getModule(ctx, EditorModule);
  editor.selectedEntities = message.selectedEntities;
  editor.activeEntity = message.activeEntity;

  const event: SelectionChangedEvent = {
    selectedEntities: message.selectedEntities,
    activeEntity: message.activeEntity,
  };
  editor.eventEmitter.emit(EditorEventType.SelectionChanged, event);
}

/*******
 * API *
 *******/

export function loadEditor(ctx: IMainThreadContext) {
  ctx.sendMessage<LoadEditorMessage>(Thread.Game, {
    type: EditorMessageType.LoadEditor,
  });
}

export function disposeEditor(ctx: IMainThreadContext) {
  const editor = getModule(ctx, EditorModule);
  editor.editorLoaded = false;
  editor.names = new Map();
  ctx.sendMessage<DisposeEditorMessage>(Thread.Game, {
    type: EditorMessageType.DisposeEditor,
  });
}

export function toggleSelectedEntity(ctx: IMainThreadContext, eid: number) {
  ctx.sendMessage<ToggleSelectedEntityMessage>(Thread.Game, {
    type: EditorMessageType.ToggleSelectedEntity,
    eid,
  });
}

export function setSelectedEntity(ctx: IMainThreadContext, eid: number) {
  ctx.sendMessage<SetSelectedEntityMessage>(Thread.Game, {
    type: EditorMessageType.SetSelectedEntity,
    eid,
  });
}

export function addSelectedEntity(ctx: IMainThreadContext, eid: number) {
  ctx.sendMessage<AddSelectedEntityMessage>(Thread.Game, {
    type: EditorMessageType.AddSelectedEntity,
    eid,
  });
}

export function focusEntity(ctx: IMainThreadContext, eid: number) {
  ctx.sendMessage<FocusEntityMessage>(Thread.Game, {
    type: EditorMessageType.FocusEntity,
    eid,
  });
}

export function renameEntity(ctx: IMainThreadContext, eid: number, name: string) {
  ctx.sendMessage<RenameEntityMessage>(Thread.Game, {
    type: EditorMessageType.RenameEntity,
    eid,
    name,
  });
}

export function reparentEntities(
  ctx: IMainThreadContext,
  entities: number[],
  target: number | undefined,
  position: ReparentEntityPosition
) {
  ctx.sendMessage<ReparentEntitiesMessage>(Thread.Game, {
    type: EditorMessageType.ReparentEntities,
    entities,
    target,
    position,
  });
}

/*********
 * Utils *
 *********/

function buildEditorNode(
  names: Map<number, string>,
  hierarchyView: ReadObjectTripleBufferView<HierarchyTripleBuffer>,
  eid: number,
  parent?: EditorNode
): EditorNode | undefined {
  let node: EditorNode | undefined;

  if (eid) {
    node = {
      id: eid,
      eid,
      name: names.get(eid) || `Entity ${eid}`,
      children: [],
    };

    if (parent) {
      parent.children.push(node);
    }
  }

  let curChild = hierarchyView.firstChild[eid];

  while (curChild) {
    buildEditorNode(names, hierarchyView, curChild, node);
    curChild = hierarchyView.nextSibling[curChild];
  }

  return node;
}
