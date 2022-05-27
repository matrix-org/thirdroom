import { addComponent, Component, defineComponent, defineQuery, removeComponent } from "bitecs";
import { vec3, mat4 } from "gl-matrix";

import { GameState, IInitialGameThreadState } from "../GameTypes";
import { shallowArraysEqual } from "../utils/shallowArraysEqual";
import {
  AddComponentMessage,
  //ExportGLTFMessage,
  RemoveComponentMessage,
  SelectionChangedMessage,
  SetComponentPropertyMessage,
  WorkerMessages,
  WorkerMessageType,
} from "../WorkerMessage";
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
import { getDirection, registerTransformComponent, Transform } from "../component/transform";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  disableActionMap,
  enableActionMap,
} from "../input/ActionMappingSystem";
import { getRaycastResults, raycast, createRay } from "../raycaster/raycaster.game";
import { copyToWriteBuffer, swapWriteBuffer, TripleBuffer } from "../allocator/TripleBuffer";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { InputModule } from "../input/input.game";

// TODO: Importing this module changes the order of Renderable / Transform imports
// Which in turn changes the cursor buffer view order and breaks transforms.
//import { exportGLTF } from "../gltf/exportGLTF";

/*********
 * Types *
 ********/

export interface EditorModuleState {
  rayId: number;
  editorLoaded: boolean;
  messages: WorkerMessages[];
  selectedEntities: number[];
  activeEntity?: number;
  activeEntityChanged: boolean;
  componentIdMap: Map<Component, number>;
  componentInfoMap: Map<number, ComponentInfo>;
  propertyIdMap: Map<ComponentPropertyStore, number>;
  propertyGetterMap: Map<number, ComponentPropertyGetter>;
  propertySetterMap: Map<number, ComponentPropertySetter>;
  componentAdderMap: Map<number, ComponentAdder>;
  componentRemoverMap: Map<number, ComponentRemover>;
  nextComponentId: number;
  nextPropertyId: number;
  hierarchyTripleBuffer: TripleBuffer;
}

/******************
 * Initialization *
 *****************/

export const EditorModule = defineModule<GameState, IInitialGameThreadState, EditorModuleState>({
  create({ hierarchyTripleBuffer }) {
    return {
      rayId: createRay(),
      editorLoaded: false,
      messages: [],
      selectedEntities: [],
      activeEntity: undefined,
      activeEntityChanged: false,
      nextComponentId: 1,
      componentIdMap: new Map(),
      componentInfoMap: new Map(),
      componentAdderMap: new Map(),
      componentRemoverMap: new Map(),
      nextPropertyId: 1,
      propertyIdMap: new Map(),
      propertyGetterMap: new Map(),
      propertySetterMap: new Map(),
      hierarchyTripleBuffer,
    };
  },
  init(ctx) {
    const disposables = [
      registerMessageHandler(ctx, WorkerMessageType.LoadEditor, onLoadEditor),
      registerMessageHandler(ctx, WorkerMessageType.DisposeEditor, onDisposeEditor),
      registerMessageHandler(ctx, WorkerMessageType.AddComponent, onEditorMessage),
      registerMessageHandler(ctx, WorkerMessageType.RemoveComponent, onEditorMessage),
      registerMessageHandler(ctx, WorkerMessageType.SetComponentProperty, onEditorMessage),
      //registerMessageHandler(ctx, WorkerMessageType.ExportGLTF, onExportGLTF),
    ];

    registerTransformComponent(ctx);

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

export function onLoadEditor(state: GameState) {
  const editor = getModule(state, EditorModule);

  editor.editorLoaded = true;

  enableActionMap(state, editorActionMap);

  postMessage({
    type: WorkerMessageType.EditorLoaded,
    componentInfos: editor.componentInfoMap,
  });

  addComponent(state.world, Selected, state.camera);
}

export function onDisposeEditor(state: GameState) {
  const editor = getModule(state, EditorModule);

  editor.editorLoaded = false;
  editor.messages.length = 0;
  disableActionMap(state, editorActionMap);
}

export function onEditorMessage(state: GameState, message: any) {
  const editor = getModule(state, EditorModule);

  if (editor.editorLoaded) {
    editor.messages.push(message);
  }
}

function onAddComponent(state: GameState, message: AddComponentMessage) {
  const editor = getModule(state, EditorModule);
  const { entities, componentId, props } = message;

  const adder = editor.componentAdderMap.get(componentId);

  if (!adder) {
    return;
  }

  // Should we make setters that take the full entity array to batch operations?
  for (let i = 0; i < entities.length; i++) {
    adder(state, entities[i], props);
  }
}

function onRemoveComponent(state: GameState, message: RemoveComponentMessage) {
  const editor = getModule(state, EditorModule);
  const remover = editor.componentRemoverMap.get(message.componentId);

  if (!remover) {
    return;
  }

  // Should we make setters that take the full entity array to batch operations?
  for (let i = 0; i < message.entities.length; i++) {
    remover(state, message.entities[i]);
  }
}

function onSetComponentProperty(state: GameState, message: SetComponentPropertyMessage) {
  const editor = getModule(state, EditorModule);
  const setter = editor.propertySetterMap.get(message.propertyId);

  if (!setter) {
    return;
  }

  // Should we make setters that take the full entity array to batch operations?
  for (let i = 0; i < message.entities.length; i++) {
    setter(state, message.entities[i], message.value);
  }
}

// function onExportGLTF(state: GameState, message: ExportGLTFMessage) {
//   exportGLTF(state, state.scene);
// }

/***********
 * Systems *
 **********/

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

export const Selected = defineComponent({});

const selectedQuery = defineQuery([Selected]);

export function EditorStateSystem(state: GameState) {
  const editor = getModule(state, EditorModule);

  if (!editor.editorLoaded) {
    return;
  }

  while (editor.messages.length) {
    const msg = editor.messages.pop();
    if (msg) processEditorMessage(state, msg);
  }

  const selectedEntities = selectedQuery(state.world);

  if (!shallowArraysEqual(selectedEntities, editor.selectedEntities) || editor.activeEntityChanged) {
    updateSelectedEntities(state, selectedEntities.slice());
  }

  copyToWriteBuffer(editor.hierarchyTripleBuffer, hierarchyBuffer);
  swapWriteBuffer(editor.hierarchyTripleBuffer);
}

function processEditorMessage(state: GameState, message: WorkerMessages) {
  switch (message.type) {
    case WorkerMessageType.AddComponent:
      onAddComponent(state, message);
      break;
    case WorkerMessageType.RemoveComponent:
      onRemoveComponent(state, message);
      break;
    case WorkerMessageType.SetComponentProperty:
      onSetComponentProperty(state, message);
      break;
  }
}

function updateSelectedEntities(state: GameState, selectedEntities: number[]) {
  const editor = getModule(state, EditorModule);
  editor.selectedEntities = selectedEntities;

  const activeEntity = editor.activeEntity;

  let activeEntityComponents: number[] | undefined;
  let activeEntityTripleBuffer: TripleBuffer | undefined;

  if (editor.activeEntityChanged) {
    // TODO: collect active entity components and construct activeEntityTripleBuffer
  }

  postMessage({
    type: WorkerMessageType.SelectionChanged,
    selectedEntities,
    activeEntity,
    activeEntityComponents,
    activeEntityTripleBuffer,
  } as SelectionChangedMessage);
}

const editorRayId = 0;

export function EditorSelectionSystem(state: GameState) {
  const editor = getModule(state, EditorModule);

  if (!editor.editorLoaded) {
    return;
  }

  const raycastResults = getRaycastResults(state, editorRayId);

  if (raycastResults && raycastResults.length > 0) {
    const intersection = raycastResults[raycastResults.length - 1];

    const selectedEntities = editor.selectedEntities;

    for (let i = 0; i < selectedEntities.length; i++) {
      removeComponent(state.world, Selected, selectedEntities[i]);
    }

    addComponent(state.world, Selected, intersection.entity);

    if (intersection.entity !== editor.activeEntity) {
      editor.activeEntity = intersection.entity;
      editor.activeEntityChanged = true;
    }
  }

  const input = getModule(state, InputModule);

  const select = input.actions.get(EditorActions.select) as ButtonActionState;

  if (select.pressed) {
    const direction = getDirection(vec3.create(), Transform.worldMatrix[state.camera]);
    vec3.negate(direction, direction);
    raycast(state, editorRayId, mat4.getTranslation(vec3.create(), Transform.worldMatrix[state.camera]), direction);
  }
}

/**
 * Component definitions (for editor, serialization/deserialization, and networking)
 */

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
  const editor = getModule(state, EditorModule);
  const props: ComponentPropertyInfo[] = [];

  for (const [name, { type, store }] of Object.entries(definition.props)) {
    const propertyId = editor.nextPropertyId++;
    const propInfo: ComponentPropertyInfo = {
      id: propertyId,
      name,
      type,
    };
    props.push(propInfo);
    editor.propertyIdMap.set(store, propertyId);
    editor.propertyGetterMap.set(propertyId, ComponentPropertyGetters[type](store));
    editor.propertySetterMap.set(propertyId, ComponentPropertySetters[type](store));
  }

  const componentId = editor.nextComponentId++;
  editor.componentIdMap.set(component, componentId);
  editor.componentInfoMap.set(componentId, {
    name: definition.name,
    props,
  });
  editor.componentAdderMap.set(componentId, definition.add);
  editor.componentRemoverMap.set(componentId, definition.remove);
}
