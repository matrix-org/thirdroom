import { addView, createCursorBuffer, CursorBuffer } from "../allocator/CursorBuffer";
import { copyToWriteBuffer, createTripleBuffer, swapWriteBuffer } from "../TripleBuffer";
import { flagGet, flagSet } from "./Bitmask";
import { InputArray, Input, InputObjectType } from "./InputKeys";

export type InputState = {
  buffer: ArrayBuffer;
  keyView: Uint32Array;
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
  const keyView = addView(buffer, Uint32Array, Math.ceil(InputArray.length / 32));
  const floatView = addView(buffer, Float32Array, 2);

  const zeroUint32 = new Uint32Array(keyView.length);
  const zeroFloat32 = new Float32Array(floatView.length);

  return {
    buffer,
    keyView,
    floatView,
    zeroUint32,
    zeroFloat32,
  };
};

export const resetInputState = (inputState: InputState) => {
  inputState.keyView.set(inputState.zeroUint32);
  inputState.floatView.set(inputState.zeroFloat32);
};

export const copyInputState = (inputStateA: InputState, inputStateB: InputState) => {
  inputStateA.keyView.set(inputStateB.keyView);
  inputStateA.floatView.set(inputStateB.floatView);
};

export const setInputButtonDown = (inputState: InputState, input: number, value: number) =>
  flagSet(inputState.keyView, input, value);

export const getInputButtonDown = (inputState: InputState, input: number) => flagGet(inputState.keyView, input);

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
      setInputButtonDown(inputState, Input[code as keyof InputObjectType], 1);
    }
  }

  function onKeyUp({ code }: KeyboardEvent) {
    if (document.pointerLockElement === canvas) {
      input[code] = false;
      setInputButtonDown(inputState, Input[code as keyof InputObjectType], 0);
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
