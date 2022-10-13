import { ActionState, ActionMap } from "./ActionMappingSystem";
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

export const createInputController = (props: InputControllerProps): InputController => ({
  inputRingBuffer: props.inputRingBuffer || createInputRingBuffer(Float32Array, RING_BUFFER_MAX),
  actionMaps: props.actionMaps || [],
  actions: props.actions || new Map(),
  raw: {},
});
