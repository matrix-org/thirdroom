import { GameState } from "../GameTypes";
import { Transform } from "../component/transform";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { EditorLoadedMessage, EditorMessageType, EditorNode } from "./editor.common";
import { createDisposables } from "../utils/createDisposables";
import { Name } from "../component/Name";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  editorLoaded: boolean;
}

/******************
 * Initialization *
 ******************/

export const EditorModule = defineModule<GameState, EditorModuleState>({
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

export function onLoadEditor(ctx: GameState) {
  const editor = getModule(ctx, EditorModule);

  editor.editorLoaded = true;

  ctx.sendMessage<EditorLoadedMessage>(Thread.Main, {
    type: EditorMessageType.EditorLoaded,
    scene: buildEditorNode(ctx.activeScene),
  });
}

export function onDisposeEditor(state: GameState) {
  const editor = getModule(state, EditorModule);
  editor.editorLoaded = false;
}

/***********
 * Systems *
 ***********/

export function EditorStateSystem(state: GameState) {
  const editor = getModule(state, EditorModule);

  if (!editor.editorLoaded) {
    return;
  }
}

/*********
 * Utils *
 *********/

function buildEditorNode(eid: number, parent?: EditorNode): EditorNode | undefined {
  let node: EditorNode | undefined;

  if (eid) {
    node = {
      id: eid,
      eid,
      name: Name.get(eid) || `Entity ${eid}`,
      children: [],
    };

    if (parent) {
      parent.children.push(node);
    }
  }

  let curChild = Transform.firstChild[eid];

  while (curChild) {
    buildEditorNode(curChild, node);
    curChild = Transform.nextSibling[curChild];
  }

  return node;
}
