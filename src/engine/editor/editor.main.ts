import EventEmitter from "events";

import {
  DisposeEditorMessage,
  EditorLoadedMessage,
  EditorMessageType,
  EditorNode,
  EditorStateTripleBuffer,
  HierarchyTripleBuffer,
  InitializeEditorStateMessage,
  LoadEditorMessage,
  NamesChangedMessage,
} from "./editor.common";
import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  names: Map<number, string>;
  editorStateTripleBuffer: EditorStateTripleBuffer;
  hierarchyTripleBuffer: HierarchyTripleBuffer;
  eventEmitter: EventEmitter;
  editorLoaded: boolean;
}

/************************
 * Editor Message Types *
 ************************/

export enum EditorEventType {
  EditorLoaded = "editor-loaded",
  HierarchyChanged = "hierarchy-changed",
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

  editor.eventEmitter.emit(EditorEventType.HierarchyChanged, scene);
}

/********************
 * Message Handlers *
 ********************/

function onEditorLoaded(ctx: IMainThreadContext, message: EditorLoadedMessage) {
  const editor = getModule(ctx, EditorModule);
  editor.editorLoaded = true;
  editor.names = message.names;
  editor.eventEmitter.emit(EditorEventType.EditorLoaded);
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
