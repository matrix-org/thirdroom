import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { EditorMessageType } from "./editor.common";
import { createDisposables } from "../utils/createDisposables";
import { RenderThreadState } from "../renderer/renderer.render";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  editorLoaded: boolean;
}

/******************
 * Initialization *
 ******************/

export const EditorModule = defineModule<RenderThreadState, EditorModuleState>({
  name: "editor",
  create() {
    return {
      editorLoaded: false,
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, EditorMessageType.LoadEditor, onLoadEditor),
      registerMessageHandler(ctx, EditorMessageType.DisposeEditor, onDisposeEditor),
    ]);
  },
});

/********************
 * Message Handlers *
 ********************/

export function onLoadEditor(ctx: RenderThreadState) {
  const editor = getModule(ctx, EditorModule);
  editor.editorLoaded = true;
}

export function onDisposeEditor(ctx: RenderThreadState) {
  const editor = getModule(ctx, EditorModule);
  editor.editorLoaded = false;
}
