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

interface MainThreadEditorState {
  selectedEntities: number[];
  activeEntity?: number;
  activeEntityComponents?: number[];
  componentInfoMap: Map<number, ComponentInfo>;
  componentProperties: Map<number, any>;
  eventListeners: Map<string, ((...args: any[]) => void)[]>;
  hierarchyTripleBuffer: TripleBufferState;
  hierarchyViews: HierarchyView[];
  activeHierarchyView: HierarchyView;
  activeEntityTripleBuffer?: TripleBufferState;
  activeEntityViews?: ActiveEntityView[];
  activeEntityView?: ActiveEntityView;
}

interface HierarchyView {
  parent: Uint32Array;
  firstChild: Uint32Array;
  prevSibling: Uint32Array;
  nextSibling: Uint32Array;
  hierarchyUpdated: Uint8Array;
}

export function createMainThreadEditorState(): MainThreadEditorState {
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
    eventListeners: new Map(),
    hierarchyTripleBuffer,
    hierarchyViews,
    activeHierarchyView: hierarchyViews[getReadBufferIndex(hierarchyTripleBuffer)],
  };
}

export function initEditorMainThread(editorState: MainThreadEditorState, gameWorker: Worker) {
  gameWorker.addEventListener("message", ({ data }) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    switch (message.type) {
      case WorkerMessageType.EditorLoaded:
        onEditorLoaded(editorState, message);
        break;
      case WorkerMessageType.SelectionChanged:
        onSelectionChanged(editorState, message);
        break;
      case WorkerMessageType.ComponentInfoChanged:
        onComponentInfoChanged(editorState, message);
        break;
      case WorkerMessageType.ComponentPropertyChanged:
        onComponentPropertyChanged(editorState, message);
        break;
    }
  });
}

function emitEditorEvent(state: MainThreadEditorState, type: EditorEventType, ...args: any[]) {
  const listeners = state.eventListeners.get(type);

  if (!listeners) {
    return;
  }

  for (const listener of listeners) {
    listener(...args);
  }
}

function onEditorLoaded(editorState: MainThreadEditorState, message: EditorLoadedMessage) {
  editorState.componentInfoMap = new Map(message.componentInfos);
  emitEditorEvent(editorState, EditorEventType.EditorLoaded);
}

function onSelectionChanged(editorState: MainThreadEditorState, message: SelectionChangedMessage) {
  editorState.selectedEntities = message.selectedEntities;
  editorState.activeEntity = message.activeEntity;
  editorState.activeEntityComponents = message.activeEntityComponents;
  editorState.activeEntityTripleBuffer = message.activeEntityTripleBuffer;

  let activeEntityViews: ActiveEntityView[] | undefined;
  let activeEntityView: ActiveEntityView | undefined;

  if (message.activeEntityTripleBuffer && message.activeEntityComponents) {
    activeEntityViews = createActiveEntityViews(
      message.activeEntityTripleBuffer,
      message.activeEntityComponents,
      editorState.componentInfoMap
    );
    activeEntityView = activeEntityViews[getReadBufferIndex(message.activeEntityTripleBuffer)];
  }

  editorState.activeEntityViews = activeEntityViews;
  editorState.activeEntityView = activeEntityView;

  emitEditorEvent(editorState, EditorEventType.SelectionChanged, {
    selectedEntities: editorState.selectedEntities,
    activeEntity: editorState.activeEntity,
    activeEntityComponents: editorState.activeEntityComponents,
  } as Selection);
}

function onComponentInfoChanged(editorState: MainThreadEditorState, message: ComponentInfoChangedMessage) {
  editorState.componentInfoMap.set(message.componentId, message.componentInfo);
  emitEditorEvent(editorState, EditorEventType.ComponentInfoChanged, message.componentId, message.componentInfo);
}

function onComponentPropertyChanged(editorState: MainThreadEditorState, message: ComponentPropertyChangedMessage) {}

export function loadEditor(gameWorker: Worker) {
  gameWorker.postMessage({
    type: WorkerMessageType.LoadEditor,
  });
}

export function disposeEditor(editorState: MainThreadEditorState, gameWorker: Worker) {
  editorState.selectedEntities = [];
  editorState.componentInfoMap.clear();
  editorState.componentProperties.clear();
  gameWorker.postMessage({
    type: WorkerMessageType.DisposeEditor,
  });
}

export function removeComponent(editorState: MainThreadEditorState, gameWorker: Worker, componentId: number) {
  gameWorker.postMessage({
    type: WorkerMessageType.RemoveComponent,
    entities: editorState.selectedEntities,
    componentId,
  });
}

export function setComponentProperty(
  editorState: MainThreadEditorState,
  gameWorker: Worker,
  propertyId: number,
  value: any
) {
  gameWorker.postMessage({
    type: WorkerMessageType.SetComponentProperty,
    entities: editorState.selectedEntities,
    propertyId,
    value,
  });
}

export function mainEditorSystem(editorState: MainThreadEditorState) {
  // Set activeHierarchyView to point to the latest updated triple buffer view containing scene hierarchy info
  swapReadBuffer(editorState.hierarchyTripleBuffer);
  editorState.activeHierarchyView = editorState.hierarchyViews[getReadBufferIndex(editorState.hierarchyTripleBuffer)];

  if (editorState.activeEntityTripleBuffer && editorState.activeEntityViews) {
    swapReadBuffer(editorState.activeEntityTripleBuffer);
    editorState.activeEntityView =
      editorState.activeEntityViews[getReadBufferIndex(editorState.activeEntityTripleBuffer)];
  }
}
