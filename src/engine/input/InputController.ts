import { vec3 } from "gl-matrix";

import { createHistorian, Historian } from "../utils/Historian";
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
  return {
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
};
