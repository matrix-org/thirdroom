import { ComponentInfo } from "../component/types";
import { ActiveEntityView, createActiveEntityViews, EditorEventType, Selection } from "./editor.common";
import { createTripleBuffer, getReadBufferIndex, swapReadBuffer, TripleBufferState } from "../TripleBuffer";
import {
  ComponentInfoChangedMessage,
  ComponentPropertyChangedMessage,
  EditorLoadedMessage,
  SelectionChangedMessage,
  WorkerMessages,
  WorkerMessageType,
} from "../WorkerMessage";
import { addView, createCursorBuffer } from "../allocator/CursorBuffer";
import { maxEntities } from "../config";
import { MainThreadModule } from "../types/types.main";
import { MainThreadState } from "../MainThread";

export default {
  create: createMainThreadEditorState,
  init: initEditorMainThread,
} as MainThreadModule<MainThreadEditorState>;

interface HierarchyView {
  parent: Uint32Array;
  firstChild: Uint32Array;
  prevSibling: Uint32Array;
  nextSibling: Uint32Array;
  hierarchyUpdated: Uint8Array;
}

export interface MainThreadEditorState {
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

function createMainThreadEditorState(): MainThreadEditorState {
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

  return {
    selectedEntities: [],
    activeEntity: undefined,
    activeEntityComponents: [],
    componentInfoMap: new Map(),
    componentProperties: new Map(),
    hierarchyTripleBuffer,
    hierarchyViews,
    activeHierarchyView: hierarchyViews[getReadBufferIndex(hierarchyTripleBuffer)],
  };
}

function initEditorMainThread(state: MainThreadState) {
  state.gameWorker.addEventListener("message", ({ data }) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    switch (message.type) {
      case WorkerMessageType.EditorLoaded:
        onEditorLoaded(state, message);
        break;
      case WorkerMessageType.SelectionChanged:
        onSelectionChanged(state, message);
        break;
      case WorkerMessageType.ComponentInfoChanged:
        onComponentInfoChanged(state, message);
        break;
      case WorkerMessageType.ComponentPropertyChanged:
        onComponentPropertyChanged(state, message);
        break;
    }
  });

  state.systems.push(mainEditorSystem);
}

function onEditorLoaded(state: MainThreadState, message: EditorLoadedMessage) {
  state.editor.componentInfoMap = new Map(message.componentInfos);
  state.emit(EditorEventType.EditorLoaded);
}

function onSelectionChanged(state: MainThreadState, message: SelectionChangedMessage) {
  state.editor.selectedEntities = message.selectedEntities;
  state.editor.activeEntity = message.activeEntity;
  state.editor.activeEntityComponents = message.activeEntityComponents;
  state.editor.activeEntityTripleBuffer = message.activeEntityTripleBuffer;

  let activeEntityViews: ActiveEntityView[] | undefined;
  let activeEntityView: ActiveEntityView | undefined;

  if (message.activeEntityTripleBuffer && message.activeEntityComponents) {
    activeEntityViews = createActiveEntityViews(
      message.activeEntityTripleBuffer,
      message.activeEntityComponents,
      state.editor.componentInfoMap
    );
    activeEntityView = activeEntityViews[getReadBufferIndex(message.activeEntityTripleBuffer)];
  }

  state.editor.activeEntityViews = activeEntityViews;
  state.editor.activeEntityView = activeEntityView;

  state.emit(EditorEventType.SelectionChanged, {
    selectedEntities: state.editor.selectedEntities,
    activeEntity: state.editor.activeEntity,
    activeEntityComponents: state.editor.activeEntityComponents,
  } as Selection);
}

function onComponentInfoChanged(state: MainThreadState, message: ComponentInfoChangedMessage) {
  state.editor.componentInfoMap.set(message.componentId, message.componentInfo);
  state.emit(EditorEventType.ComponentInfoChanged, message.componentId, message.componentInfo);
}

function onComponentPropertyChanged(state: MainThreadState, message: ComponentPropertyChangedMessage) {}

export function sendLoadEditorMessage({ gameWorker }: MainThreadState) {
  gameWorker.postMessage({
    type: WorkerMessageType.LoadEditor,
  });
}

export function sendDisposeEditorMessage({ editor, gameWorker }: MainThreadState) {
  editor.selectedEntities = [];
  editor.componentInfoMap.clear();
  editor.componentProperties.clear();
  gameWorker.postMessage({
    type: WorkerMessageType.DisposeEditor,
  });
}

export function sendRemoveComponentMessage({ editor, gameWorker }: MainThreadState, componentId: number) {
  gameWorker.postMessage({
    type: WorkerMessageType.RemoveComponent,
    entities: editor.selectedEntities,
    componentId,
  });
}

export function sendSetComponentPropertyMessage(
  { editor, gameWorker }: MainThreadState,
  propertyId: number,
  value: any
) {
  gameWorker.postMessage({
    type: WorkerMessageType.SetComponentProperty,
    entities: editor.selectedEntities,
    propertyId,
    value,
  });
}

export function sendExportSceneMessage(state: MainThreadState) {
  state.gameWorker.postMessage({
    type: WorkerMessageType.ExportScene,
  });
}

function mainEditorSystem(state: MainThreadState) {
  const editorState = state.editor;

  // Set activeHierarchyView to point to the latest updated triple buffer view containing scene hierarchy info
  swapReadBuffer(editorState.hierarchyTripleBuffer);
  editorState.activeHierarchyView = editorState.hierarchyViews[getReadBufferIndex(editorState.hierarchyTripleBuffer)];

  if (editorState.activeEntityTripleBuffer && editorState.activeEntityViews) {
    swapReadBuffer(editorState.activeEntityTripleBuffer);
    editorState.activeEntityView =
      editorState.activeEntityViews[getReadBufferIndex(editorState.activeEntityTripleBuffer)];
  }
}
