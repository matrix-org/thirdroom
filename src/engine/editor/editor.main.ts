import EventEmitter from "events";

import { ComponentInfo } from "../component/types";
import {
  ActiveEntityView,
  createActiveEntityViews,
  EditorEventType,
  EditorMessageType,
  editorModuleName,
  InitializeEditorStateMessage,
  Selection,
  SharedHierarchyState,
} from "./editor.common";
import { getReadBufferIndex, swapReadBuffer, TripleBuffer } from "../allocator/TripleBuffer";
import {
  ComponentInfoChangedMessage,
  ComponentPropertyChangedMessage,
  EditorLoadedMessage,
  SaveGLTFMessage,
  SelectionChangedMessage,
  WorkerMessageType,
} from "../WorkerMessage";
import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { registerThirdroomGlobalFn } from "../utils/registerThirdroomGlobal";
import { downloadFile } from "../utils/downloadFile";

/*********
 * Types *
 ********/

export interface EditorModuleState extends EventEmitter {
  selectedEntities: number[];
  activeEntity?: number;
  activeEntityComponents?: number[];
  componentInfoMap: Map<number, ComponentInfo>;
  componentProperties: Map<number, any>;
  activeEntityTripleBuffer?: TripleBuffer;
  activeEntityViews?: ActiveEntityView[];
  activeEntityView?: ActiveEntityView;
  sharedHierarchyState: SharedHierarchyState;
}

/******************
 * Initialization *
 *****************/

// Access module-specific state by importing this context in your systems, modules, or React components
export const EditorModule = defineModule<IMainThreadContext, EditorModuleState>({
  name: editorModuleName,
  async create(ctx, { waitForMessage }) {
    const { sharedHierarchyState } = await waitForMessage<InitializeEditorStateMessage>(
      EditorMessageType.InitializeEditorState
    );

    return Object.assign(new EventEmitter(), {
      selectedEntities: [],
      activeEntity: undefined,
      activeEntityComponents: [],
      componentInfoMap: new Map(),
      componentProperties: new Map(),
      sharedHierarchyState,
    });
  },
  init(ctx) {
    const disposables = [
      registerMessageHandler(ctx, WorkerMessageType.EditorLoaded, onEditorLoaded),
      registerMessageHandler(ctx, WorkerMessageType.SelectionChanged, onSelectionChanged),
      registerMessageHandler(ctx, WorkerMessageType.ComponentInfoChanged, onComponentInfoChanged),
      registerMessageHandler(ctx, WorkerMessageType.ComponentPropertyChanged, onComponentPropertyChanged),
      registerMessageHandler(ctx, WorkerMessageType.SaveGLTF, onSaveGLTF),
      registerThirdroomGlobalFn("exportScene", () => {
        sendExportSceneMessage(ctx);
      }),
    ];

    return () => {
      // Optional dispose function
      sendDisposeEditorMessage(ctx);

      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

/***********
 * Systems *
 **********/

export function MainThreadEditorSystem(mainThread: IMainThreadContext) {
  const editor = getModule(mainThread, EditorModule);

  // Set activeHierarchyView to point to the latest updated triple buffer view containing scene hierarchy info
  // getReadObjectBufferView(editor.sharedHierarchyState);

  if (editor.activeEntityTripleBuffer && editor.activeEntityViews) {
    swapReadBuffer(editor.activeEntityTripleBuffer);
    editor.activeEntityView = editor.activeEntityViews[getReadBufferIndex(editor.activeEntityTripleBuffer)];
  }
}

/********************
 * Message Handlers *
 *******************/

function onEditorLoaded(mainThread: IMainThreadContext, message: EditorLoadedMessage) {
  const editor = getModule(mainThread, EditorModule);
  editor.componentInfoMap = new Map(message.componentInfos);
  editor.emit(EditorEventType.EditorLoaded);
}

function onSelectionChanged(mainThread: IMainThreadContext, message: SelectionChangedMessage) {
  const editor = getModule(mainThread, EditorModule);
  editor.selectedEntities = message.selectedEntities;
  editor.activeEntity = message.activeEntity;
  editor.activeEntityComponents = message.activeEntityComponents;
  editor.activeEntityTripleBuffer = message.activeEntityTripleBuffer;

  let activeEntityViews: ActiveEntityView[] | undefined;
  let activeEntityView: ActiveEntityView | undefined;

  if (message.activeEntityTripleBuffer && message.activeEntityComponents) {
    activeEntityViews = createActiveEntityViews(
      message.activeEntityTripleBuffer,
      message.activeEntityComponents,
      editor.componentInfoMap
    );
    activeEntityView = activeEntityViews[getReadBufferIndex(message.activeEntityTripleBuffer)];
  }

  editor.activeEntityViews = activeEntityViews;
  editor.activeEntityView = activeEntityView;

  editor.emit(EditorEventType.SelectionChanged, {
    selectedEntities: editor.selectedEntities,
    activeEntity: editor.activeEntity,
    activeEntityComponents: editor.activeEntityComponents,
  } as Selection);
}

function onComponentInfoChanged(ctx: IMainThreadContext, message: ComponentInfoChangedMessage) {
  const editor = getModule(ctx, EditorModule);
  editor.componentInfoMap.set(message.componentId, message.componentInfo);
  editor.emit(EditorEventType.ComponentInfoChanged, message.componentId, message.componentInfo);
}

function onComponentPropertyChanged(ctx: IMainThreadContext, message: ComponentPropertyChangedMessage) {}

function onSaveGLTF(ctx: IMainThreadContext, message: SaveGLTFMessage) {
  downloadFile(message.buffer, "scene.glb", "application/octet-stream");
}

/*******
 * API *
 ******/

export function sendLoadEditorMessage(ctx: IMainThreadContext) {
  ctx.gameWorker.postMessage({ type: WorkerMessageType.LoadEditor });
}

export function sendRemoveComponentMessage(ctx: IMainThreadContext, componentId: number) {
  const editor = getModule(ctx, EditorModule);
  ctx.gameWorker.postMessage({
    type: WorkerMessageType.RemoveComponent,
    entities: editor.selectedEntities,
    componentId,
  });
}

export function sendSetComponentPropertyMessage(ctx: IMainThreadContext, propertyId: number, value: any) {
  const editor = getModule(ctx, EditorModule);
  ctx.gameWorker.postMessage({
    type: WorkerMessageType.SetComponentProperty,
    entities: editor.selectedEntities,
    propertyId,
    value,
  });
}

export function sendExportSceneMessage(ctx: IMainThreadContext) {
  ctx.gameWorker.postMessage({
    type: WorkerMessageType.ExportScene,
  });
}

export function sendDisposeEditorMessage(ctx: IMainThreadContext) {
  ctx.gameWorker.postMessage({ type: WorkerMessageType.DisposeEditor });
}
