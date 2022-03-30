import { addView, createCursorBuffer, CursorBuffer } from "../allocator/CursorBuffer";
import { copyToWriteBuffer, createTripleBuffer, swapWriteBuffer } from "../TripleBuffer";
import { flagGet, flagSet } from "./Bitmask";
import { InputArray, Input, InputObjectType } from "./InputKeys";

export type InputState = {
  buffer: ArrayBuffer;
  pressedView: Uint32Array;
  heldView: Uint32Array;
  releasedView: Uint32Array;
  floatView: Float32Array;
  zeroUint32: Uint32Array;
  zeroFloat32: Float32Array;
};

export function createInputManager(canvas: HTMLCanvasElement) {
  const inputState = createInputState();
  const tripleBuffer = createTripleBuffer(inputState.buffer.byteLength);

  const dispose = bindInputEvents(inputState, canvas);

  return {
    tripleBuffer,
    update() {
      copyToWriteBuffer(tripleBuffer, inputState.buffer);
      swapWriteBuffer(tripleBuffer);
    },
    dispose() {
      dispose();
    },
  };
}

export const createInputState = (buffer: CursorBuffer = createCursorBuffer()): InputState => {
  const pressedView = addView(buffer, Uint32Array, Math.ceil(InputArray.length / 32));
  const heldView = addView(buffer, Uint32Array, Math.ceil(InputArray.length / 32));
  const releasedView = addView(buffer, Uint32Array, Math.ceil(InputArray.length / 32));
  const floatView = addView(buffer, Float32Array, 2);

  const zeroUint32 = new Uint32Array(pressedView.length);
  const zeroFloat32 = new Float32Array(floatView.length);

  return {
    buffer,
    pressedView,
    heldView,
    releasedView,
    floatView,
    zeroUint32,
    zeroFloat32,
  };
};

export const resetInputState = (inputState: InputState) => {
  inputState.pressedView.set(inputState.zeroUint32);
  inputState.heldView.set(inputState.zeroUint32);
  inputState.releasedView.set(inputState.zeroUint32);
  inputState.floatView.set(inputState.zeroFloat32);
};

export const copyInputState = (inputStateA: InputState, inputStateB: InputState) => {
  inputStateA.pressedView.set(inputStateB.pressedView);
  inputStateA.releasedView.set(inputStateB.releasedView);
  inputStateA.heldView.set(inputStateB.heldView);
  inputStateA.floatView.set(inputStateB.floatView);
};

export const setInputButtonPressed = (inputState: InputState, input: number, value: number) =>
  flagSet(inputState.pressedView, input, value);
export const setInputButtonReleased = (inputState: InputState, input: number, value: number) =>
  flagSet(inputState.releasedView, input, value);
export const setInputButtonHeld = (inputState: InputState, input: number, value: number) =>
  flagSet(inputState.heldView, input, value);

export const getInputButtonPressed = (inputState: InputState, input: number) => flagGet(inputState.pressedView, input);
export const getInputButtonReleased = (inputState: InputState, input: number) =>
  flagGet(inputState.releasedView, input);
export const getInputButtonHeld = (inputState: InputState, input: number) => flagGet(inputState.heldView, input);

export const setInputMouseX = (inputState: InputState, value: number) => (inputState.floatView[0] = value);
export const setInputMouseY = (inputState: InputState, value: number) => (inputState.floatView[1] = value);

export const getInputMouseX = (inputState: InputState) => inputState.floatView[0];
export const getInputMouseY = (inputState: InputState) => inputState.floatView[1];

export const bindInputEvents = (inputState: InputState, canvas: HTMLElement): (() => void) => {
  const input: { [key: string]: boolean } = {};

  function onMouseDown() {
    canvas.requestPointerLock();
  }

  function onKeyDown({ code }: KeyboardEvent) {
    if (document.pointerLockElement === canvas) {
      if (input[code]) return;
      input[code] = true;
      setInputButtonPressed(inputState, Input[code as keyof InputObjectType], 1);
      setInputButtonHeld(inputState, Input[code as keyof InputObjectType], 1);
    }
  }

  function onKeyUp({ code }: KeyboardEvent) {
    if (document.pointerLockElement === canvas) {
      input[code] = false;
      setInputButtonReleased(inputState, Input[code as keyof InputObjectType], 1);
      setInputButtonHeld(inputState, Input[code as keyof InputObjectType], 0);
    }
  }

  function onMouseMove({ movementX, movementY }: MouseEvent) {
    if (document.pointerLockElement === canvas) {
      setInputMouseX(inputState, movementX);
      setInputMouseY(inputState, movementY);
    }
  }

  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousemove", onMouseMove);

  return () => {
    canvas.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("mousemove", onMouseMove);
  };
};
