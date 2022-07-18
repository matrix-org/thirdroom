import EventEmitter from "events";

import {
  DisposeEditorMessage,
  EditorLoadedMessage,
  EditorMessageType,
  EditorNode,
  LoadEditorMessage,
} from "./editor.common";
import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  eventEmitter: EventEmitter;
  editorLoaded: boolean;
  scene?: EditorNode;
}

/************************
 * Editor Message Types *
 ************************/

export enum EditorEventType {
  EditorLoaded = "editor-loaded",
}

/******************
 * Initialization *
 ******************/

// Access module-specific state by importing this context in your systems, modules, or React components
export const EditorModule = defineModule<IMainThreadContext, EditorModuleState>({
  name: "editor",
  create() {
    return {
      eventEmitter: new EventEmitter(),
      editorLoaded: false,
    };
  },
  init(ctx) {
    return createDisposables([registerMessageHandler(ctx, EditorMessageType.EditorLoaded, onEditorLoaded)]);
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
}

/********************
 * Message Handlers *
 ********************/

function onEditorLoaded(ctx: IMainThreadContext, message: EditorLoadedMessage) {
  const editor = getModule(ctx, EditorModule);
  editor.editorLoaded = true;
  editor.eventEmitter.emit(EditorEventType.EditorLoaded, message.scene);
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
  ctx.sendMessage<DisposeEditorMessage>(Thread.Game, {
    type: EditorMessageType.DisposeEditor,
  });
}
