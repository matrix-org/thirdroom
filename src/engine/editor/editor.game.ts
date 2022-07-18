import { enterQuery, exitQuery } from "bitecs";

import { GameState } from "../GameTypes";
import { hierarchyObjectBuffer } from "../component/transform";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  EditorLoadedMessage,
  EditorMessageType,
  editorStateSchema,
  EditorStateTripleBuffer,
  HierarchyTripleBuffer,
  InitializeEditorStateMessage,
  NamesChangedMessage,
} from "./editor.common";
import { createDisposables } from "../utils/createDisposables";
import { Name, nameQuery } from "../component/Name";
import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { hierarchyObjectBufferSchema } from "../component/transform.common";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  editorStateBufferView: ObjectBufferView<typeof editorStateSchema, ArrayBuffer>;
  editorStateTripleBuffer: EditorStateTripleBuffer;
  hierarchyTripleBuffer: HierarchyTripleBuffer;
  editorLoaded: boolean;
}

/******************
 * Initialization *
 ******************/

export const EditorModule = defineModule<GameState, EditorModuleState>({
  name: "editor",
  create(ctx, { sendMessage }) {
    const editorStateBufferView = createObjectBufferView(editorStateSchema, ArrayBuffer);
    const editorStateTripleBuffer = createObjectTripleBuffer(editorStateSchema, ctx.gameToMainTripleBufferFlags);
    const hierarchyTripleBuffer = createObjectTripleBuffer(
      hierarchyObjectBufferSchema,
      ctx.gameToMainTripleBufferFlags
    );

    sendMessage<InitializeEditorStateMessage>(Thread.Main, EditorMessageType.InitializeEditorState, {
      editorStateTripleBuffer,
      hierarchyTripleBuffer,
    });

    return {
      editorStateBufferView,
      editorStateTripleBuffer,
      hierarchyTripleBuffer,
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
    names: Name,
  });
}

export function onDisposeEditor(state: GameState) {
  const editor = getModule(state, EditorModule);
  editor.editorLoaded = false;
}

/***********
 * Systems *
 ***********/

const nameEnterQuery = enterQuery(nameQuery);
const nameExitQuery = exitQuery(nameQuery);
export const editorNameChangedQueue: [number, string][] = [];

export function EditorStateSystem(ctx: GameState) {
  const editor = getModule(ctx, EditorModule);

  if (!editor.editorLoaded) {
    return;
  }

  editor.editorStateBufferView.activeSceneEid[0] = ctx.activeScene;

  commitToObjectTripleBuffer(editor.editorStateTripleBuffer, editor.editorStateBufferView);
  commitToObjectTripleBuffer(editor.hierarchyTripleBuffer, hierarchyObjectBuffer);

  const entered = nameEnterQuery(ctx.world);
  const exited = nameExitQuery(ctx.world);

  if (entered.length === 0 && exited.length === 0 && editorNameChangedQueue.length === 0) {
    return;
  }

  const created: [number, string][] = [];

  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    created.push([eid, Name.get(eid) || `Entity ${eid}`]);
  }

  const deleted: number[] = [];

  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    deleted.push(eid);
  }

  ctx.sendMessage<NamesChangedMessage>(Thread.Main, {
    type: EditorMessageType.NamesChanged,
    created,
    updated: editorNameChangedQueue,
    deleted,
  });

  editorNameChangedQueue.length = 0;
}
