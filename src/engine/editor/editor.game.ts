import {
  addComponent,
  defineComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  hasComponent,
  removeComponent,
} from "bitecs";
import RAPIER from "@dimforge/rapier3d-compat";
import { vec3 } from "gl-matrix";
import { Vector3 } from "three";

import { GameContext } from "../GameTypes";
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
  SetRefPropertyMessage,
  SetRefArrayPropertyMessage,
} from "./editor.common";
import { createDisposables } from "../utils/createDisposables";
import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { NOOP } from "../config.common";
import { addLayer, Layer, removeLayer } from "../common/Layers";
import { getRemoteResource, RemoteResourceTypes, tryGetRemoteResource } from "../resource/resource.game";
import { RemoteNode } from "../resource/RemoteResources";
import { disableActionMap, enableActionMap } from "../input/ActionMappingSystem";
import { ActionMap, ActionType, BindingType, ButtonActionState } from "../input/ActionMap";
import { InputModule } from "../input/input.game";
import { flyControlsQuery } from "../player/FlyCharacterController";
import { getCamera } from "../player/getCamera";
import { setRenderNodeOptimizationsEnabled } from "../renderer/renderer.game";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  editorLoaded: boolean;
  activeEntity: number;
  activeEntityChanged: boolean;
  editorStateBufferView: ObjectBufferView<typeof editorStateSchema, ArrayBuffer>;
  editorStateTripleBuffer: EditorStateTripleBuffer;
  anchorEntity: number;
}

const editorActionMap: ActionMap = {
  id: "editor-action-map",
  actionDefs: [
    {
      id: "anchorCamera",
      path: "anchorCamera",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyF",
        },
      ],
    },
  ],
};

/******************
 * Initialization *
 ******************/

export const EditorModule = defineModule<GameContext, EditorModuleState>({
  name: "editor",
  create(ctx, { sendMessage }) {
    const editorStateBufferView = createObjectBufferView(editorStateSchema, ArrayBuffer);
    const editorStateTripleBuffer = createObjectTripleBuffer(editorStateSchema, ctx.gameToMainTripleBufferFlags);

    sendMessage<InitializeEditorStateMessage>(Thread.Main, EditorMessageType.InitializeEditorState, {
      editorStateTripleBuffer,
    });

    return {
      editorLoaded: false,
      activeEntity: NOOP,
      activeEntityChanged: false,
      editorStateBufferView,
      editorStateTripleBuffer,
      anchorEntity: NOOP,
    };
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);

    enableActionMap(input, editorActionMap);

    const dispose = createDisposables([
      registerMessageHandler(ctx, EditorMessageType.LoadEditor, onLoadEditor),
      registerMessageHandler(ctx, EditorMessageType.DisposeEditor, onDisposeEditor),
      registerMessageHandler(ctx, EditorMessageType.SetSelectedEntity, onSetSelectedEntity),
      registerMessageHandler(ctx, EditorMessageType.AddSelectedEntity, onAddSelectedEntity),
      registerMessageHandler(ctx, EditorMessageType.ToggleSelectedEntity, onToggleSelectedEntity),
      registerMessageHandler(ctx, EditorMessageType.FocusEntity, onFocusEntity),
      registerMessageHandler(ctx, EditorMessageType.RenameEntity, onRenameEntity),
      registerMessageHandler(ctx, EditorMessageType.ReparentEntities, onReparentEntities),
      registerMessageHandler(ctx, EditorMessageType.SetProperty, onSetProperty),
      registerMessageHandler(ctx, EditorMessageType.SetRefProperty, onSetRefProperty),
      registerMessageHandler(ctx, EditorMessageType.SetRefArrayProperty, onSetRefArrayProperty),
    ]);
    return () => {
      disableActionMap(input, editorActionMap);
      dispose();
    };
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

export function onLoadEditor(ctx: GameContext) {
  const editor = getModule(ctx, EditorModule);

  editor.editorLoaded = true;
  ctx.editorLoaded = true;

  setRenderNodeOptimizationsEnabled(ctx, false);

  ctx.sendMessage<EditorLoadedMessage>(Thread.Main, {
    type: EditorMessageType.EditorLoaded,
    activeEntity: editor.activeEntity,
    selectedEntities: Array.from(selectedQuery(ctx.world)),
  });
}

export function onDisposeEditor(ctx: GameContext) {
  const editor = getModule(ctx, EditorModule);
  editor.editorLoaded = true;
  ctx.editorLoaded = false;
  setRenderNodeOptimizationsEnabled(ctx, true);
}

function onSetSelectedEntity(ctx: GameContext, message: SetSelectedEntityMessage) {
  selectEditorEntity(ctx, message.eid);
}

export function selectEditorEntity(ctx: GameContext, eid: number) {
  const editor = getModule(ctx, EditorModule);

  const selected = selectedQuery(ctx.world);

  for (let i = 0; i < selected.length; i++) {
    const selectedEid = selected[i];

    if (eid === selectedEid) {
      continue;
    }

    removeComponent(ctx.world, Selected, selectedEid);
  }

  if (eid) {
    addComponent(ctx.world, Selected, eid);
  }

  editor.activeEntity = eid;
  editor.activeEntityChanged = true;
}

export function onAddSelectedEntity(ctx: GameContext, message: AddSelectedEntityMessage) {
  const editor = getModule(ctx, EditorModule);
  addComponent(ctx.world, Selected, message.eid);
  editor.activeEntity = message.eid;
  editor.activeEntityChanged = true;
}

export function onToggleSelectedEntity(ctx: GameContext, message: ToggleSelectedEntityMessage) {
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

export function onFocusEntity(ctx: GameContext, message: FocusEntityMessage) {}

export function onRenameEntity(ctx: GameContext, message: RenameEntityMessage) {
  const node = getRemoteResource<RemoteNode>(ctx, message.eid);

  if (node) {
    node.name = message.name;
  }
}

export function onReparentEntities(ctx: GameContext, message: ReparentEntitiesMessage) {}

function onSetProperty(ctx: GameContext, message: SetPropertyMessage<unknown>) {
  const resource = getRemoteResource<RemoteResourceTypes>(ctx, message.eid);

  const propName = message.propName;

  if (!resource || typeof resource !== "object" || !("resourceType" in resource) || !(propName in resource)) {
    return;
  }

  (resource as any)[propName] = message.value;
}

function onSetRefProperty(ctx: GameContext, message: SetRefPropertyMessage) {
  const resource = getRemoteResource<RemoteResourceTypes>(ctx, message.eid);
  const ref = getRemoteResource<RemoteResourceTypes>(ctx, message.refEid);
  const propName = message.propName;

  if (!resource || typeof resource !== "object" || !("resourceType" in resource) || !(propName in resource)) {
    return;
  }
  (resource as any)[propName] = ref;
}

function onSetRefArrayProperty(ctx: GameContext, message: SetRefArrayPropertyMessage) {
  const resource = getRemoteResource<RemoteResourceTypes>(ctx, message.eid);
  const refArray = message.refEids.map((eid) => getRemoteResource<RemoteResourceTypes>(ctx, eid));
  const propName = message.propName;

  if (!resource || typeof resource !== "object" || !("resourceType" in resource) || !(propName in resource)) {
    return;
  }
  (resource as any)[propName] = refArray;
}

/***********
 * Systems *
 ***********/

export function moveCharacterToAnchor(
  ctx: GameContext,
  body: RAPIER.RigidBody,
  anchor: RemoteNode,
  playerRig: RemoteNode,
  camera: RemoteNode
) {
  const posVec = anchor.position;

  const charPos = vec3.create();

  vec3.set(charPos, posVec[0], posVec[1], posVec[2]);

  vec3.set(playerRig.position, charPos[0], charPos[1], charPos[2]);
  vec3.set(camera.position, charPos[0], charPos[1], charPos[2]);

  const _p = new Vector3();
  _p.fromArray(playerRig.position);
  body.setNextKinematicTranslation(_p);
}

export function EditorStateSystem(ctx: GameContext) {
  const editor = getModule(ctx, EditorModule);

  if (!ctx.editorLoaded) {
    return;
  }

  const { actionStates } = getModule(ctx, InputModule);
  const anchorBtn = actionStates.get("anchorCamera") as ButtonActionState;

  const anchorCameraToActiveEntity = anchorBtn.pressed;
  if (anchorCameraToActiveEntity && editor.activeEntity) {
    editor.anchorEntity = editor.activeEntity;

    const anchorEntity = getRemoteResource<RemoteNode>(ctx, editor.anchorEntity);
    if (typeof anchorEntity === "object" && "position" in anchorEntity) {
      const ents = flyControlsQuery(ctx.world);

      for (let i = 0; i < ents.length; i++) {
        const playerRigEid = ents[i];
        const playerRig = tryGetRemoteResource<RemoteNode>(ctx, playerRigEid);
        getCamera(ctx, playerRig);

        const body = playerRig.physicsBody?.body;

        if (!body) {
          throw new Error("Physics body not found on eid " + playerRigEid);
        }
        // TODO: Place camera near active entity on `F` key press.
        // moveCharacterToAnchor(ctx, body, anchorEntity, playerRig, camera);
      }
    }
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
      const selectedNode = tryGetRemoteResource<RemoteNode>(ctx, eid);

      traverse(selectedNode, (child) => {
        child.layers = removeLayer(child.layers, Layer.EditorSelection);
      });
    }

    for (let i = 0; i < selectedAdded.length; i++) {
      const eid = selectedAdded[i];
      const selectedNode = tryGetRemoteResource<RemoteNode>(ctx, eid);

      traverse(selectedNode, (child) => {
        child.layers = addLayer(child.layers, Layer.EditorSelection);
      });
    }
  }
}
