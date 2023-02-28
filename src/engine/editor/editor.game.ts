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
import { traverse } from "../component/transform";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  AddSelectedEntityMessage,
  EditorLoadedMessage,
  EditorMessageType,
  editorStateSchema,
  EditorStateTripleBuffer,
  FocusEntityMessage,
  InitializeEditorStateMessage,
  RenameEntityMessage,
  ReparentEntitiesMessage,
  SelectionChangedMessage,
  SetSelectedEntityMessage,
  ToggleSelectedEntityMessage,
  SetPropertyMessage,
  SetTexturePropertyMessage,
} from "./editor.common";
import { createDisposables } from "../utils/createDisposables";
import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { NOOP } from "../config.common";
import { addLayer, Layer, removeLayer } from "../node/node.common";
import { getRemoteResource, RemoteResourceTypes } from "../resource/resource.game";
import { RemoteNode } from "../resource/RemoteResources";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  activeEntity: number;
  activeEntityChanged: boolean;
  editorStateBufferView: ObjectBufferView<typeof editorStateSchema, ArrayBuffer>;
  editorStateTripleBuffer: EditorStateTripleBuffer;
}

/******************
 * Initialization *
 ******************/

export const EditorModule = defineModule<GameState, EditorModuleState>({
  name: "editor",
  create(ctx, { sendMessage }) {
    const editorStateBufferView = createObjectBufferView(editorStateSchema, ArrayBuffer);
    const editorStateTripleBuffer = createObjectTripleBuffer(editorStateSchema, ctx.gameToMainTripleBufferFlags);

    sendMessage<InitializeEditorStateMessage>(Thread.Main, EditorMessageType.InitializeEditorState, {
      editorStateTripleBuffer,
    });

    return {
      activeEntity: NOOP,
      activeEntityChanged: false,
      editorStateBufferView,
      editorStateTripleBuffer,
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
      registerMessageHandler(ctx, EditorMessageType.SetProperty, onSetProperty),
      registerMessageHandler(ctx, EditorMessageType.SetTextureProperty, onSetTextureProperty),
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

/********************
 * Message Handlers *
 ********************/

export function onLoadEditor(ctx: GameState) {
  const editor = getModule(ctx, EditorModule);

  ctx.editorLoaded = true;

  ctx.sendMessage<EditorLoadedMessage>(Thread.Main, {
    type: EditorMessageType.EditorLoaded,
    activeEntity: editor.activeEntity,
    selectedEntities: Array.from(selectedQuery(ctx.world)),
  });
}

export function onDisposeEditor(ctx: GameState) {
  ctx.editorLoaded = false;
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
  const node = getRemoteResource<RemoteNode>(ctx, message.eid);

  if (node) {
    node.name = message.name;
  }
}

export function onReparentEntities(ctx: GameState, message: ReparentEntitiesMessage) {}

function onSetProperty(ctx: GameState, message: SetPropertyMessage<unknown>) {
  const resource = getRemoteResource<RemoteResourceTypes>(ctx, message.eid);

  const propName = message.propName;

  if (!resource || typeof resource !== "object" || !("resourceType" in resource) || !(propName in resource)) {
    return;
  }

  (resource as any)[propName] = message.value;
}

function onSetTextureProperty(ctx: GameState, message: SetTexturePropertyMessage) {
  const resource = getRemoteResource<RemoteResourceTypes>(ctx, message.eid);
  const texture = getRemoteResource<RemoteResourceTypes>(ctx, message.textureEid);
  const propName = message.propName;

  if (!resource || typeof resource !== "object" || !("resourceType" in resource) || !(propName in resource)) {
    return;
  }
  (resource as any)[propName] = texture;
}

/***********
 * Systems *
 ***********/

export function EditorStateSystem(ctx: GameState) {
  const editor = getModule(ctx, EditorModule);

  if (!ctx.editorLoaded) {
    return;
  }

  // Update editor state and hierarchy triple buffers
  commitToObjectTripleBuffer(editor.editorStateTripleBuffer, editor.editorStateBufferView);

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
      const selectedNode = getRemoteResource<RemoteNode>(ctx, eid)!;

      traverse(selectedNode, (child) => {
        child.layers = removeLayer(child.layers, Layer.EditorSelection);
      });
    }

    for (let i = 0; i < selectedAdded.length; i++) {
      const eid = selectedAdded[i];
      const selectedNode = getRemoteResource<RemoteNode>(ctx, eid)!;

      traverse(selectedNode, (child) => {
        child.layers = addLayer(child.layers, Layer.EditorSelection);
      });
    }
  }
}
