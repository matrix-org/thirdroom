import { addComponent, defineQuery, exitQuery, hasComponent, removeComponent } from "bitecs";

import { World } from "../GameTypes";
import { ActionState, ActionMap } from "./ActionMappingSystem";
import { GameInputModule } from "./input.game";
import { InputRingBuffer, createInputRingBuffer, RING_BUFFER_MAX } from "./RingBuffer";

export interface InputController {
  inputRingBuffer: InputRingBuffer<Float32ArrayConstructor>;
  actions: Map<string, ActionState>;
  actionMaps: ActionMap[];
  raw: { [path: string]: number };
}

export interface InputControllerProps {
  inputRingBuffer?: InputRingBuffer<Float32ArrayConstructor>;
  actions?: Map<string, ActionState>;
  actionMaps?: ActionMap[];
}

export const createInputController = (props?: InputControllerProps): InputController => ({
  inputRingBuffer: (props && props.inputRingBuffer) || createInputRingBuffer(Float32Array, RING_BUFFER_MAX),
  actionMaps: (props && props.actionMaps) || [],
  actions: (props && props.actions) || new Map(),
  raw: {},
});

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

export function getInputController(input: GameInputModule, eid: number) {
  const controller = input.controllers.get(eid);
  if (!controller) throw new Error("could not find input controller for eid: " + eid);
  return controller;
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
