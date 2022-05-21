import EventEmitter from "events";

import { ComponentInfo } from "../component/types";
import { ActiveEntityView, createActiveEntityViews, EditorEventType, Selection } from "./editor.common";
import { createTripleBuffer, getReadBufferIndex, swapReadBuffer, TripleBufferState } from "../TripleBuffer";
import {
  ComponentInfoChangedMessage,
  ComponentPropertyChangedMessage,
  EditorLoadedMessage,
  SaveGLTFMessage,
  SelectionChangedMessage,
  WorkerMessageType,
} from "../WorkerMessage";
import { addView, createCursorBuffer } from "../allocator/CursorBuffer";
import { maxEntities } from "../config.common";
import { IMainThreadContext } from "../MainThread";
import { getScope, registerMessageHandler, registerSystem } from "../types/types.common";
import { registerThirdroomGlobalFn } from "../utils/registerThirdroomGlobal";

interface HierarchyView {
  parent: Uint32Array;
  firstChild: Uint32Array;
  prevSibling: Uint32Array;
  nextSibling: Uint32Array;
  hierarchyUpdated: Uint8Array;
}

export interface EditorScope extends EventEmitter {
  selectedEntities: number[];
  activeEntity?: number;
  activeEntityComponents?: number[];
  componentInfoMap: Map<number, ComponentInfo>;
  componentProperties: Map<number, any>;
  hierarchyTripleBuffer: TripleBufferState;
  hierarchyViews: HierarchyView[];
  activeHierarchyView: HierarchyView;
  activeEntityTripleBuffer?: TripleBufferState;
  activeEntityViews?: ActiveEntityView[];
  activeEntityView?: ActiveEntityView;
}

// Access module-specific state by importing this context in your systems, modules, or React components
export function EditorScope(ctx: IMainThreadContext): EditorScope {
  const hierarchyTripleBuffer = createTripleBuffer();
  const cursorBuffers = hierarchyTripleBuffer.buffers.map((b) => createCursorBuffer(b));

  const hierarchyViews = cursorBuffers.map(
    (buffer) =>
      ({
        // note: needs synced with sceneHierarchyBuffer properties in game worker
        // todo: abstract the need to sync structure with sceneHierarchyBuffer properties
        parent: addView(buffer, Uint32Array, maxEntities),
        firstChild: addView(buffer, Uint32Array, maxEntities),
        prevSibling: addView(buffer, Uint32Array, maxEntities),
        nextSibling: addView(buffer, Uint32Array, maxEntities),
        hierarchyUpdated: addView(buffer, Uint8Array, maxEntities),
      } as HierarchyView)
  );

  return Object.assign(
    {
      selectedEntities: [],
      activeEntity: undefined,
      activeEntityComponents: [],
      componentInfoMap: new Map(),
      componentProperties: new Map(),
      hierarchyTripleBuffer,
      hierarchyViews,
      activeHierarchyView: hierarchyViews[getReadBufferIndex(hierarchyTripleBuffer)],
    },
    new EventEmitter()
  );
}

export function EditorModule(ctx: IMainThreadContext) {
  const editor = getScope(ctx, EditorScope);

  ctx.initialGameWorkerState.hierarchyTripleBuffer = editor.hierarchyTripleBuffer;

  const disposables = [
    registerMessageHandler(ctx, WorkerMessageType.EditorLoaded, onEditorLoaded),
    registerMessageHandler(ctx, WorkerMessageType.SelectionChanged, onSelectionChanged),
    registerMessageHandler(ctx, WorkerMessageType.ComponentInfoChanged, onComponentInfoChanged),
    registerMessageHandler(ctx, WorkerMessageType.ComponentPropertyChanged, onComponentPropertyChanged),
    registerMessageHandler(ctx, WorkerMessageType.SaveGLTF, onSaveGLTF),
    registerSystem(ctx, MainThreadEditorSystem),
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
}

function MainThreadEditorSystem(mainThread: IMainThreadContext) {
  const editor = getScope(mainThread, EditorScope);

  // Set activeHierarchyView to point to the latest updated triple buffer view containing scene hierarchy info
  swapReadBuffer(editor.hierarchyTripleBuffer);
  editor.activeHierarchyView = editor.hierarchyViews[getReadBufferIndex(editor.hierarchyTripleBuffer)];

  if (editor.activeEntityTripleBuffer && editor.activeEntityViews) {
    swapReadBuffer(editor.activeEntityTripleBuffer);
    editor.activeEntityView = editor.activeEntityViews[getReadBufferIndex(editor.activeEntityTripleBuffer)];
  }
}

function onEditorLoaded(mainThread: IMainThreadContext, message: EditorLoadedMessage) {
  const editor = getScope(mainThread, EditorScope);
  editor.componentInfoMap = new Map(message.componentInfos);
  editor.emit(EditorEventType.EditorLoaded);
}

function onSelectionChanged(mainThread: IMainThreadContext, message: SelectionChangedMessage) {
  const editor = getScope(mainThread, EditorScope);
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
  const editor = getScope(ctx, EditorScope);
  editor.componentInfoMap.set(message.componentId, message.componentInfo);
  editor.emit(EditorEventType.ComponentInfoChanged, message.componentId, message.componentInfo);
}

function onComponentPropertyChanged(ctx: IMainThreadContext, message: ComponentPropertyChangedMessage) {}

function onSaveGLTF(ctx: IMainThreadContext, message: SaveGLTFMessage) {
  downloadFile(message.buffer, "scene.glb");
}

function downloadFile(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const el = document.createElement("a");
  el.style.display = "none";
  document.body.appendChild(el);
  el.href = URL.createObjectURL(blob);
  el.download = fileName;
  el.click();
  document.body.removeChild(el);
}

export function sendLoadEditorMessage(ctx: IMainThreadContext) {
  ctx.gameWorker.postMessage({ type: WorkerMessageType.LoadEditor });
}

export function sendRemoveComponentMessage(ctx: IMainThreadContext, componentId: number) {
  const editor = getScope(ctx, EditorScope);
  ctx.gameWorker.postMessage({
    type: WorkerMessageType.RemoveComponent,
    entities: editor.selectedEntities,
    componentId,
  });
}

export function sendSetComponentPropertyMessage(ctx: IMainThreadContext, propertyId: number, value: any) {
  const editor = getScope(ctx, EditorScope);
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
