import {
  defineObjectBufferSchema,
  ObjectBufferView,
  TripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { flagGet } from "./Bitmask";
import { Keys } from "./KeyCodes";

export const inputStateSchema = defineObjectBufferSchema({
  keyboard: [Uint32Array, Math.ceil(Keys.length / 32)],
  mouseMovement: [Float32Array, 2],
  mouseButtons: [Uint32Array, 1],
});

export type InputState = ObjectBufferView<typeof inputStateSchema, ArrayBuffer>;
export type SharedInputState = TripleBufferBackedObjectBufferView<typeof inputStateSchema, ArrayBuffer>;

type InputStateGetter = (input: InputState) => number;

const keyIndexToInputState =
  (index: number): InputStateGetter =>
  (input: InputState) =>
    flagGet(input.keyboard, index);

const mouseMovementIndexToInputState =
  (index: number): InputStateGetter =>
  (input: InputState) =>
    input.mouseMovement[index];

const mouseButtonIndexToInputState =
  (index: number): InputStateGetter =>
  (input: InputState) =>
    flagGet(input.mouseButtons, index);

export const InputStateGetters: { [path: string]: InputStateGetter } = Object.fromEntries([
  ...Keys.map((key, i) => [`Keyboard/${key}`, keyIndexToInputState(i)]),
  ["Mouse/movementX", mouseMovementIndexToInputState(0)],
  ["Mouse/movementY", mouseMovementIndexToInputState(1)],
  ...Array(6)
    .fill(0)
    .map((_, i) => [`Mouse/button${i}`, mouseButtonIndexToInputState(i)]),
]);

export enum InputMessageType {
  InitializeInputState = "initialize-input-state",
}

export interface InitializeInputStateMessage {
  sharedInputState: SharedInputState;
}
