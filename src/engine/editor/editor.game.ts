import { addComponent, Component, defineComponent, defineQuery, removeComponent } from "bitecs";
import { vec3, mat4 } from "gl-matrix";

import { GameState } from "../GameWorker";
import { shallowArraysEqual } from "../utils/shallowArraysEqual";
import { SelectionChangedMessage, WorkerMessages, WorkerMessageType } from "../WorkerMessage";
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
import { getDirection, Transform } from "../component/transform";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  disableActionMap,
  enableActionMap,
} from "../input/ActionMappingSystem";
import { getRaycastResults, raycast, createRay } from "../raycaster/raycaster.game";

export interface EditorState {
  rayId: number;
  editorLoaded: boolean;
  messages: WorkerMessages[];
  selectedEntities: number[];
  componentIdMap: Map<Component, number>;
  componentInfoMap: Map<number, ComponentInfo>;
  propertyIdMap: Map<ComponentPropertyStore, number>;
  propertyGetterMap: Map<number, ComponentPropertyGetter>;
  propertySetterMap: Map<number, ComponentPropertySetter>;
  componentAdderMap: Map<number, ComponentAdder>;
  componentRemoverMap: Map<number, ComponentRemover>;
  nextComponentId: number;
  nextPropertyId: number;
}

export function initEditorState(): EditorState {
  return {
    rayId: createRay(),
    editorLoaded: false,
    messages: [],
    selectedEntities: [],
    nextComponentId: 1,
    componentIdMap: new Map(),
    componentInfoMap: new Map(),
    componentAdderMap: new Map(),
    componentRemoverMap: new Map(),
    nextPropertyId: 1,
    propertyIdMap: new Map(),
    propertyGetterMap: new Map(),
    propertySetterMap: new Map(),
  };
}

export enum EditorActions {
  select = "Editor/select",
}

const editorActionMap: ActionMap = {
  id: "Editor",
  actions: [
    {
      id: "select",
      path: EditorActions.select,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyG",
        },
      ],
    },
  ],
};

export function initEditor(state: GameState) {
  state.postSystems.push(EditorStateSystem);
  state.postSystems.push(EditorSelectionSystem);
}

export function onLoadEditor(state: GameState) {
  state.editorState.editorLoaded = true;

  enableActionMap(state, editorActionMap);

  postMessage({
    type: WorkerMessageType.EditorLoaded,
    componentInfos: state.editorState.componentInfoMap,
  });

  addComponent(state.world, Selected, state.camera);
}

export function onDisposeEditor(state: GameState) {
  state.editorState.editorLoaded = false;
  state.editorState.messages.length = 0;
  disableActionMap(state, editorActionMap);
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

  const components: number[] = [];
  const initialValues: Map<number, ComponentPropertyValue> = new Map();

  // TODO: Do this dynamically
  const componentId = state.editorState.componentIdMap.get(Transform)!;
  components.push(componentId);
  const propertyId = state.editorState.propertyIdMap.get(Transform.position)!;
  initialValues.set(propertyId, state.editorState.propertyGetterMap.get(propertyId)!(state, selectedEntities[0]));

  postMessage({
    type: WorkerMessageType.SelectionChanged,
    selection: {
      entities: selectedEntities,
      components,
    },
    initialValues,
  } as SelectionChangedMessage);
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
  component: Component,
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
    editorState.propertyIdMap.set(store, propertyId);
    editorState.propertyGetterMap.set(propertyId, ComponentPropertyGetters[type](store));
    editorState.propertySetterMap.set(propertyId, ComponentPropertySetters[type](store));
  }

  const componentId = editorState.nextComponentId++;
  editorState.componentIdMap.set(component, componentId);
  editorState.componentInfoMap.set(componentId, {
    name: definition.name,
    props,
  });
  editorState.componentAdderMap.set(componentId, definition.add);
  editorState.componentRemoverMap.set(componentId, definition.remove);
}

const editorRayId = 0;

export function EditorSelectionSystem(state: GameState) {
  if (!state.editorState.editorLoaded) {
    return;
  }

  const raycastResults = getRaycastResults(state, editorRayId);

  if (raycastResults && raycastResults.length > 0) {
    const intersection = raycastResults[raycastResults.length - 1];

    const selectedEntities = state.editorState.selectedEntities;

    for (let i = 0; i < selectedEntities.length; i++) {
      removeComponent(state.world, Selected, selectedEntities[i]);
    }

    addComponent(state.world, Selected, intersection.entity);
  }

  const select = state.input.actions.get(EditorActions.select) as ButtonActionState;

  if (select.pressed) {
    const direction = getDirection(vec3.create(), Transform.worldMatrix[state.camera]);
    vec3.negate(direction, direction);
    raycast(state, editorRayId, mat4.getTranslation(vec3.create(), Transform.worldMatrix[state.camera]), direction);
  }
}
