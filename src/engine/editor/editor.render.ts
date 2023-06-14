import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { EditorMessageType } from "./editor.common";
import { createDisposables } from "../utils/createDisposables";
import { RenderContext } from "../renderer/renderer.render";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  editorLoaded: boolean;
}

/******************
 * Initialization *
 ******************/

export const EditorModule = defineModule<RenderContext, EditorModuleState>({
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

export function onLoadEditor(ctx: RenderContext) {
  const editor = getModule(ctx, EditorModule);
  editor.editorLoaded = true;
}

export function onDisposeEditor(ctx: RenderContext) {
  const editor = getModule(ctx, EditorModule);
  editor.editorLoaded = false;
}
