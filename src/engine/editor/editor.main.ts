import EventEmitter from "events";

import {
  AddSelectedEntityMessage,
  DisposeEditorMessage,
  EditorLoadedMessage,
  EditorMessageType,
  EditorNode,
  EditorStateTripleBuffer,
  FocusEntityMessage,
  InitializeEditorStateMessage,
  LoadEditorMessage,
  RenameEntityMessage,
  ReparentEntitiesMessage,
  ReparentEntityPosition,
  SelectionChangedMessage,
  SetSelectedEntityMessage,
  ToggleSelectedEntityMessage,
  SetPropertyMessage,
  SetTexturePropertyMessage,
} from "./editor.common";
import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { NOOP } from "../config.common";
import { ResourceType } from "../resource/schema";
import { getLocalResources, MainNode, MainScene } from "../resource/resource.main";
import { ILocalResourceConstructor } from "../resource/ResourceDefinition";
import kebabToPascalCase from "../utils/kebabToPascalCase";

/*********
 * Types *
 *********/

export interface EditorModuleState {
  activeEntity: number;
  selectedEntities: number[];
  editorStateTripleBuffer: EditorStateTripleBuffer;
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
    const { editorStateTripleBuffer } = await waitForMessage<InitializeEditorStateMessage>(
      Thread.Game,
      EditorMessageType.InitializeEditorState
    );

    return {
      activeEntity: NOOP,
      selectedEntities: [],
      editorStateTripleBuffer,
      eventEmitter: new EventEmitter(),
      editorLoaded: false,
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, EditorMessageType.EditorLoaded, onEditorLoaded),
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

  updateHierarchy(mainThread, editor);
}

function updateHierarchy(ctx: IMainThreadContext, editor: EditorModuleState) {
  const publicScene = ctx.worldResource.environment?.publicScene;
  const event: HierarchyChangedEvent = {
    scene: publicScene && buildEditorNode(publicScene),
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
  editor.selectedEntities = message.selectedEntities;
  editor.activeEntity = message.activeEntity;

  const event: EditorLoadedEvent = {
    selectedEntities: message.selectedEntities,
    activeEntity: message.activeEntity,
  };
  editor.eventEmitter.emit(EditorEventType.EditorLoaded, event);
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

export function setProperty<T>(ctx: IMainThreadContext, eid: number, propName: string, value: T) {
  ctx.sendMessage<SetPropertyMessage<T>>(Thread.Game, {
    type: EditorMessageType.SetProperty,
    eid,
    propName,
    value,
  });
}

export function setTextureProperty(ctx: IMainThreadContext, eid: number, propName: string, textureEid: number) {
  ctx.sendMessage<SetTexturePropertyMessage>(Thread.Game, {
    type: EditorMessageType.SetTextureProperty,
    eid,
    propName,
    textureEid,
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

function buildEditorNode(sceneOrNode: MainScene | MainNode, parent?: EditorNode): EditorNode | undefined {
  let node: EditorNode | undefined;
  let curChild: MainNode | undefined;

  if (sceneOrNode.resourceType === ResourceType.Scene) {
    const mainScene = sceneOrNode as MainScene;

    node = {
      id: mainScene.eid,
      eid: mainScene.eid,
      name: mainScene.name ?? "Unnamed",
      children: [],
    };

    curChild = mainScene.firstNode as MainNode;
  } else {
    const mainNode = sceneOrNode as MainNode;

    node = {
      id: mainNode.eid,
      eid: mainNode.eid,
      name: mainNode.name ?? "Unnamed",
      children: [],
    };

    if (parent) {
      parent.children.push(node);
    }

    curChild = mainNode.firstChild as MainNode;
  }

  while (curChild) {
    buildEditorNode(curChild, node);
    curChild = curChild.nextSibling as MainNode | undefined;
  }

  return node;
}

export function buildResourceList(
  ctx: IMainThreadContext,
  resourceType: ILocalResourceConstructor<IMainThreadContext>
): EditorNode {
  const resourceDef = resourceType.resourceDef;

  const resourceNodes: EditorNode[] = [];

  const rootNode: EditorNode = {
    id: -1,
    eid: -1,
    name: kebabToPascalCase(resourceDef.name),
    children: resourceNodes,
  };

  const resources = getLocalResources(ctx, resourceType);

  for (const resource of resources) {
    resourceNodes.push({
      id: resource.eid,
      eid: resource.eid,
      name: "name" in resource && typeof resource.name === "string" ? resource.name : "Unknown Resource",
      children: [],
    });
  }

  return rootNode;
}
