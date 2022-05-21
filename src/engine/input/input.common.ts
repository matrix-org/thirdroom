import { addView, CursorBuffer } from "../allocator/CursorBuffer";
import { flagGet } from "./Bitmask";
import { Keys } from "./KeyCodes";

export type InputState = {
  buffer: CursorBuffer;
  keyboard: Uint32Array;
  mouse: {
    movement: Float32Array;
    buttons: Uint32Array;
  };
};

export function createInputState(buffer: CursorBuffer): InputState {
  return {
    buffer,
    keyboard: addView(buffer, Uint32Array, Math.ceil(Keys.length / 32)),
    mouse: {
      movement: addView(buffer, Float32Array, 2),
      buttons: addView(buffer, Uint32Array, 1),
    },
  };
}

type InputStateGetter = (input: InputState) => number;

const keyIndexToInputState =
  (index: number): InputStateGetter =>
  (input: InputState) =>
    flagGet(input.keyboard, index);

const mouseMovementIndexToInputState =
  (index: number): InputStateGetter =>
  (input: InputState) =>
    input.mouse.movement[index];

const mouseButtonIndexToInputState =
  (index: number): InputStateGetter =>
  (input: InputState) =>
    flagGet(input.mouse.buttons, index);

export const InputStateGetters: { [path: string]: InputStateGetter } = Object.fromEntries([
  ...Keys.map((key, i) => [`Keyboard/${key}`, keyIndexToInputState(i)]),
  ["Mouse/movementX", mouseMovementIndexToInputState(0)],
  ["Mouse/movementY", mouseMovementIndexToInputState(1)],
  ...Array(6)
    .fill(0)
    .map((_, i) => [`Mouse/button${i}`, mouseButtonIndexToInputState(i)]),
]);
