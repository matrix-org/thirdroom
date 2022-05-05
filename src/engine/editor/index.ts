import { defineComponent, defineQuery } from "bitecs";

import { GameState } from "../GameWorker";
import { shallowArraysEqual } from "../utils/shallowArraysEqual";
import { WorkerMessages, WorkerMessageType } from "../WorkerMessage";
import {
  ComponentPropertyGetter,
  ComponentPropertyGetters,
  ComponentPropertySetter,
  ComponentPropertySetters,
} from "../component/serialization";
import {
  ComponentInfo,
  ComponentPropertyInfo,
  ComponentPropertyValue,
  ComponentPropertyType,
  ComponentPropertyStore,
} from "../component/types";

export interface EditorState {
  editorLoaded: boolean;
  messages: WorkerMessages[];
  selectedEntities: number[];
  componentInfoMap: Map<number, ComponentInfo>;
  propertyGetterMap: Map<number, ComponentPropertyGetter>;
  propertySetterMap: Map<number, ComponentPropertySetter>;
  componentAdderMap: Map<number, ComponentAdder>;
  componentRemoverMap: Map<number, ComponentRemover>;
  nextComponentId: number;
  nextPropertyId: number;
}

export function initEditorState(): EditorState {
  return {
    editorLoaded: false,
    messages: [],
    selectedEntities: [],
    nextComponentId: 1,
    componentInfoMap: new Map(),
    componentAdderMap: new Map(),
    componentRemoverMap: new Map(),
    nextPropertyId: 1,
    propertyGetterMap: new Map(),
    propertySetterMap: new Map(),
  };
}

export function onLoadEditor(state: GameState) {
  state.editorState.editorLoaded = true;
  postMessage({
    type: WorkerMessageType.EditorLoaded,
    componentInfos: state.editorState.componentInfoMap,
  });
}

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
    case WorkerMessageType.AddComponent:
      onAddComponent(state, message.entities, message.componentId, message.props);
      break;
    case WorkerMessageType.RemoveComponent:
      onRemoveComponent(state, message.entities, message.componentId);
      break;
    case WorkerMessageType.SetComponentProperty:
      onSetComponentProperty(state, message.entities, message.propertyId, message.value);
      break;
  }
}

function onAddComponent<Props extends ComponentPropertyValues>(
  state: GameState,
  entities: number[],
  componentId: number,
  props?: Props
) {
  const adder = state.editorState.componentAdderMap.get(componentId);

  if (!adder) {
    return;
  }

  // Should we make setters that take the full entity array to batch operations?
  for (let i = 0; i < entities.length; i++) {
    adder(state, entities[i], props);
  }
}

function onRemoveComponent(state: GameState, entities: number[], componentId: number) {
  const remover = state.editorState.componentRemoverMap.get(componentId);

  if (!remover) {
    return;
  }

  // Should we make setters that take the full entity array to batch operations?
  for (let i = 0; i < entities.length; i++) {
    remover(state, entities[i]);
  }
}

function onSetComponentProperty(
  state: GameState,
  entities: number[],
  propertyId: number,
  value: ComponentPropertyValue
) {
  const setter = state.editorState.propertySetterMap.get(propertyId);

  if (!setter) {
    return;
  }

  // Should we make setters that take the full entity array to batch operations?
  for (let i = 0; i < entities.length; i++) {
    setter(state, entities[i], value);
  }
}

function updateSelectedEntities(state: GameState, selectedEntities: number[]) {
  state.editorState.selectedEntities = selectedEntities;

  // postMessage({
  //   type: WorkerMessageType.SelectionChanged,
  //   selection: {
  //     entities: selectedEntities,
  //     components: [],
  //   },
  //   initialValues: [],
  // } as SelectionChangedMessage);
}

export interface ComponentPropertyDefinition<PropType extends ComponentPropertyType> {
  type: PropType;
  store: ComponentPropertyStore<PropType>;
  // In the future add properties like min/max for component property editors
}

export interface ComponentPropertyMap {
  [name: string]: ComponentPropertyDefinition<ComponentPropertyType>;
}

export type ComponentPropertyValues<Props extends ComponentPropertyMap = {}> = Partial<{
  [PropName in keyof Props]: ComponentPropertyValue<Props[PropName]["type"]>;
}>;

export type ComponentAdder<Props extends ComponentPropertyMap = {}> = (
  state: GameState,
  eid: number,
  props?: ComponentPropertyValues<Props>
) => void;

export type ComponentRemover = (state: GameState, eid: number) => void;

export interface ComponentDefinition<Props extends ComponentPropertyMap = {}> {
  name: string;
  props: Props;
  add: ComponentAdder<Props>;
  remove: ComponentRemover;
}

export function registerEditorComponent<Props extends ComponentPropertyMap>(
  state: GameState,
  definition: ComponentDefinition<Props>
) {
  const editorState = state.editorState;
  const props: ComponentPropertyInfo[] = [];

  for (const [name, { type, store }] of Object.entries(definition.props)) {
    const propertyId = editorState.nextPropertyId++;
    const propInfo: ComponentPropertyInfo = {
      id: propertyId,
      name,
      type,
    };
    props.push(propInfo);
    editorState.propertyGetterMap.set(propertyId, ComponentPropertyGetters[type](store));
    editorState.propertySetterMap.set(propertyId, ComponentPropertySetters[type](store));
  }

  const componentId = editorState.nextComponentId++;
  editorState.componentInfoMap.set(componentId, {
    name: definition.name,
    props,
  });
  editorState.componentAdderMap.set(componentId, definition.add);
  editorState.componentRemoverMap.set(componentId, definition.remove);
}
