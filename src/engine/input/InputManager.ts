import { addView, createCursorBuffer } from "../allocator/CursorBuffer";
import { flagGet } from "./Bitmask";
import { flagSet } from "./Bitmask";
import { Input } from "./InputKeys";

export type InputState = {
  buffer: ArrayBuffer
  buttonView: Uint32Array
  floatView: Float32Array
}

export const createInputState = (inputArray, buffer = createCursorBuffer()): InputState => {
  const buttonView = addView(buffer, Uint32Array, inputArray.length);
  const floatView = addView(buffer, Float32Array, 2);
  
  return {
    buffer,
    buttonView,
    floatView,
  }
}

export const setInputButtonDown  = (inputState, input, value) => flagSet(inputState.buttonView, 3 * input + 0, value);
export const setInputButtonUp    = (inputState, input, value) => flagSet(inputState.buttonView, 3 * input + 1, value);
export const setInputButtonHeld  = (inputState, input, value) => flagSet(inputState.buttonView, 3 * input + 2, value);

export const getInputButtonDown  = (inputState, input) => flagGet(inputState.buttonView, 3 * input + 0);
export const getInputButtonUp    = (inputState, input) => flagGet(inputState.buttonView, 3 * input + 1);
export const getInputButtonHeld  = (inputState, input) => flagGet(inputState.buttonView, 3 * input + 2);

export const setInputMouseX = (inputState, value) => inputState.floatView[0] = value;
export const setInputMouseY = (inputState, value) => inputState.floatView[1] = value;

export const bindInputState = (inputState, canvas) => {

  canvas.addEventListener("mousedown", () => {
    canvas.requestPointerLock();
  });

  const input = {};

  window.addEventListener("keydown", ({code}) => {
    if (input[code]) return;
    input[code] = true;
    setInputButtonDown(inputState, Input[code], 1);
    setInputButtonHeld(inputState, Input[code], 1);
  });

  window.addEventListener("keyup", ({code}) => {
    input[code] = false;
    setInputButtonUp(inputState, Input[code], 1);
    setInputButtonHeld(inputState, Input[code], 0);
  });

  window.addEventListener("mousemove", ({movementX, movementY}) => {
    if (document.pointerLockElement === canvas) {
      setInputMouseX(inputState, movementX);
      setInputMouseY(inputState, movementY);
    }
  });
}