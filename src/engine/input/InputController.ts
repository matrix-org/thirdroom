import { vec3 } from "gl-matrix";
import { addComponent, defineQuery, exitQuery, hasComponent, removeComponent } from "bitecs";

import { World } from "../GameTypes";
import { createHistorian, Historian } from "../utils/Historian";
import { initializeActionMap } from "./ActionMappingSystem";
import { GameInputModule } from "./input.game";
import { InputRingBuffer, createInputRingBuffer, RING_BUFFER_MAX } from "./RingBuffer";
import { ActionDefinition, ActionMap, ActionState } from "./ActionMap";

export interface InputController {
  inputRingBuffer: InputRingBuffer;
  actionStates: Map<string, ActionState>;
  actionMaps: ActionMap[];
  raw: { [path: string]: number };
  // for networking
  pathToId: Map<string, number>;
  pathToDef: Map<string, ActionDefinition>;
  idToPath: Map<number, string>;
  // TODO: refactor this?
  outbound: Historian<[Map<string, ActionState>, { position: vec3; velocity: vec3 }]>;
  inbound: [number, ActionState][];
}

export interface InputControllerProps {
  inputRingBuffer?: InputRingBuffer;
  actionStates?: Map<string, ActionState>;
  actionMaps?: ActionMap[];
  pathToId?: Map<string, number>;
  pathToDef?: Map<string, ActionDefinition>;
  idToPath?: Map<number, string>;
}

export const createInputController = (props?: InputControllerProps): InputController => {
  const controller: InputController = {
    inputRingBuffer: (props && props.inputRingBuffer) || createInputRingBuffer(RING_BUFFER_MAX),
    actionMaps: (props && props.actionMaps) || [],
    actionStates: new Map(),
    pathToId: new Map(),
    pathToDef: new Map(),
    idToPath: new Map(),
    raw: {},
    outbound: createHistorian(),
    inbound: [],
  };
  for (const actionMap of controller.actionMaps) {
    for (const actionDef of actionMap.actionDefs) {
      initializeActionMap(controller, actionDef);
    }
  }
  return controller;
};

export const InputControllerComponent = new Map<number, InputController>();
export const inputControllerQuery = defineQuery([InputControllerComponent]);
export const exitedInputControllerQuery = exitQuery(inputControllerQuery);

export function addInputController(world: World, input: GameInputModule, controller: InputController, eid: number) {
  addComponent(world, InputControllerComponent, eid);
  input.controllers.set(eid, controller);
}

export function removeInputController(world: World, input: GameInputModule, eid: number) {
  if (hasComponent(world, InputControllerComponent, eid)) removeComponent(world, InputControllerComponent, eid);
  input.controllers.delete(eid);
}

export function tryGetInputController(input: GameInputModule, eid: number) {
  const controller = input.controllers.get(eid);
  if (!controller) throw new Error("could not find input controller for eid: " + eid);
  return controller;
}

export function getInputController(input: GameInputModule, eid: number) {
  return input.controllers.get(eid);
}

/**
 * Sets the active controller to the provided entity's controller
 * @param input GameInputModule
 * @param eid number
 */
export function setActiveInputController(input: GameInputModule, eid: number) {
  const controller = input.controllers.get(eid) || createInputController(input.defaultController);
  controller.inputRingBuffer = input.defaultController.inputRingBuffer;
  input.activeController = controller;
}
