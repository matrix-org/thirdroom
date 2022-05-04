import { Component, defineComponent, defineQuery } from "bitecs";

import { GameState } from "../GameWorker";
import { ComponentInfo } from "../MainThread";
import { shallowArraysEqual } from "../utils/shallowArraysEqual";
import { WorkerMessages, WorkerMessageType } from "../WorkerMessage";

export interface EditorState {
  editorLoaded: boolean;
  messages: WorkerMessages[];
  selectedEntities: number[];
  componentInfoMap: Map<number, ComponentInfo>;
}

export function initEditorState(): EditorState {
  return {
    editorLoaded: false,
    messages: [],
    selectedEntities: [],
    componentInfoMap: new Map(),
  };
}

export function onLoadEditor(state: GameState) {
  state.editorState.editorLoaded = true;
  postMessage({
    type: WorkerMessageType.EditorLoaded,
    componentInfos: state.editorState.componentInfoMap,
  });
}

export function registerEditorComponent(component: Component, componentInfo: ComponentInfo) {}

export function onDisposeEditor({ editorState }: GameState) {
  editorState.editorLoaded = false;
  editorState.messages.length = 0;
}

export function onEditorMessage(state: GameState, message: WorkerMessages) {
  if (state.editorState.editorLoaded) {
    state.editorState.messages.push(message);
  }
}

export const Selected = defineComponent({});

const selectedQuery = defineQuery([Selected]);

export function EditorStateSystem(state: GameState) {
  if (!state.editorState.editorLoaded) {
    return;
  }

  while (state.editorState.messages.length) {
    const msg = state.editorState.messages.pop();
    if (msg) processEditorMessage(state, msg);
  }

  const selectedEntities = selectedQuery(state.world);

  if (!shallowArraysEqual(selectedEntities, state.editorState.selectedEntities)) {
    updateSelectedEntities(state, selectedEntities.slice());
  }
}

function processEditorMessage(state: GameState, message: WorkerMessages) {
  switch (message.type) {
    case WorkerMessageType.SetComponentProperty:
      onSetComponentProperty(state, message.entities, message.propertyId, message.value);
      break;
    case WorkerMessageType.RemoveComponent:
      onRemoveComponent(state, message.entities, message.componentId);
      break;
  }
}

function onSetComponentProperty(state: GameState, entities: number[], propertyId: number, value: any) {}

function onRemoveComponent(state: GameState, entities: number[], componentId: number) {}

function updateSelectedEntities(state: GameState, selectedEntities: number[]) {
  state.editorState.selectedEntities = selectedEntities;

  // getEntityComponents();

  // postMessage({
  //   type: WorkerMessageType.SelectionChanged,
  //   selection: {
  //     entities: selectedEntities,
  //     components: [],
  //   },
  //   initialValues: [],
  // } as SelectionChangedMessage);
}
