import {
  addComponent,
  defineComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  hasComponent,
  removeComponent,
} from "bitecs";

import { GameState } from "../GameTypes";
import { hierarchyObjectBuffer, traverseRecursive } from "../component/transform";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  AddSelectedEntityMessage,
  EditorLoadedMessage,
  EditorMessageType,
  editorStateSchema,
  EditorStateTripleBuffer,
  FocusEntityMessage,
  HierarchyTripleBuffer,
  InitializeEditorStateMessage,
  NamesChangedMessage,
  RenameEntityMessage,
  ReparentEntitiesMessage,
  SelectionChangedMessage,
  SetSelectedEntityMessage,
  ToggleSelectedEntityMessage,
} from "./editor.common";
import { createDisposables } from "../utils/createDisposables";
import { Name, nameQuery, setName } from "../component/Name";
import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { hierarchyObjectBufferSchema } from "../component/transform.common";
import { NOOP } from "../config.common";
import { RemoteNodeComponent } from "../node/node.game";
import { addLayer, Layer, removeLayer } from "../node/node.common";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  activeEntity: number;
  activeEntityChanged: boolean;
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
      activeEntity: NOOP,
      activeEntityChanged: false,
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
      registerMessageHandler(ctx, EditorMessageType.SetSelectedEntity, onSetSelectedEntity),
      registerMessageHandler(ctx, EditorMessageType.AddSelectedEntity, onAddSelectedEntity),
      registerMessageHandler(ctx, EditorMessageType.ToggleSelectedEntity, onToggleSelectedEntity),
      registerMessageHandler(ctx, EditorMessageType.FocusEntity, onFocusEntity),
      registerMessageHandler(ctx, EditorMessageType.RenameEntity, onRenameEntity),
      registerMessageHandler(ctx, EditorMessageType.ReparentEntities, onReparentEntities),
    ]);
  },
});

/***********
 * Queries *
 ***********/

const Selected = defineComponent({});
const selectedQuery = defineQuery([Selected]);
const selectedEnterQuery = enterQuery(selectedQuery);
const selectedExitQuery = exitQuery(selectedQuery);

const nameEnterQuery = enterQuery(nameQuery);
const nameExitQuery = exitQuery(nameQuery);
export const editorNameChangedQueue: [number, string][] = [];

/********************
 * Message Handlers *
 ********************/

export function onLoadEditor(ctx: GameState) {
  const editor = getModule(ctx, EditorModule);

  editor.editorLoaded = true;

  ctx.sendMessage<EditorLoadedMessage>(Thread.Main, {
    type: EditorMessageType.EditorLoaded,
    names: Name,
    activeEntity: editor.activeEntity,
    selectedEntities: Array.from(selectedQuery(ctx.world)),
  });
}

export function onDisposeEditor(ctx: GameState) {
  const editor = getModule(ctx, EditorModule);
  editor.editorLoaded = false;
}

export function onSetSelectedEntity(ctx: GameState, message: SetSelectedEntityMessage) {
  const editor = getModule(ctx, EditorModule);

  const selected = selectedQuery(ctx.world);

  for (let i = 0; i < selected.length; i++) {
    const eid = selected[i];

    if (message.eid === eid) {
      continue;
    }

    removeComponent(ctx.world, Selected, eid);
  }

  addComponent(ctx.world, Selected, message.eid);

  editor.activeEntity = message.eid;
  editor.activeEntityChanged = true;
}

export function onAddSelectedEntity(ctx: GameState, message: AddSelectedEntityMessage) {
  const editor = getModule(ctx, EditorModule);
  addComponent(ctx.world, Selected, message.eid);
  editor.activeEntity = message.eid;
  editor.activeEntityChanged = true;
}

export function onToggleSelectedEntity(ctx: GameState, message: ToggleSelectedEntityMessage) {
  const editor = getModule(ctx, EditorModule);

  if (hasComponent(ctx.world, Selected, message.eid)) {
    removeComponent(ctx.world, Selected, message.eid);

    const selected = selectedQuery(ctx.world);
    editor.activeEntity = selected.length === 0 ? NOOP : selected[selected.length - 1];
  } else {
    addComponent(ctx.world, Selected, message.eid);
    editor.activeEntity = message.eid;
  }

  editor.activeEntityChanged = true;
}

export function onFocusEntity(ctx: GameState, message: FocusEntityMessage) {}

export function onRenameEntity(ctx: GameState, message: RenameEntityMessage) {
  setName(message.eid, message.name);
}

export function onReparentEntities(ctx: GameState, message: ReparentEntitiesMessage) {}

/***********
 * Systems *
 ***********/

export function EditorStateSystem(ctx: GameState) {
  const editor = getModule(ctx, EditorModule);

  if (!editor.editorLoaded) {
    return;
  }

  // Update editor state and hierarchy triple buffers
  editor.editorStateBufferView.activeSceneEid[0] = ctx.activeScene;

  commitToObjectTripleBuffer(editor.editorStateTripleBuffer, editor.editorStateBufferView);
  commitToObjectTripleBuffer(editor.hierarchyTripleBuffer, hierarchyObjectBuffer);

  // Send updated names to main thread
  const entered = nameEnterQuery(ctx.world);
  const exited = nameExitQuery(ctx.world);

  if (entered.length !== 0 || exited.length !== 0 || editorNameChangedQueue.length !== 0) {
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

  // Send updated selection state to main thread
  const selected = selectedQuery(ctx.world);
  const selectedAdded = selectedEnterQuery(ctx.world);
  const selectedRemoved = selectedExitQuery(ctx.world);

  if (selectedAdded.length > 0 || selectedRemoved.length > 0 || editor.activeEntityChanged) {
    editor.activeEntityChanged = false;

    ctx.sendMessage<SelectionChangedMessage>(Thread.Main, {
      type: EditorMessageType.SelectionChanged,
      activeEntity: editor.activeEntity,
      selectedEntities: Array.from(selected),
    });

    // Update the remote nodes with the editor selection layer added/removed
    // Recursively update this layer so that the selected effect can be applied to all descendants
    for (let i = 0; i < selectedRemoved.length; i++) {
      const eid = selectedRemoved[i];

      traverseRecursive(eid, (child) => {
        const remoteNode = RemoteNodeComponent.get(child);

        if (remoteNode) {
          remoteNode.layers = removeLayer(remoteNode.layers, Layer.EditorSelection);
        }
      });
    }

    for (let i = 0; i < selectedAdded.length; i++) {
      const eid = selectedAdded[i];

      traverseRecursive(eid, (child) => {
        const remoteNode = RemoteNodeComponent.get(child);

        if (remoteNode) {
          remoteNode.layers = addLayer(remoteNode.layers, Layer.EditorSelection);
        }
      });
    }
  }
}
