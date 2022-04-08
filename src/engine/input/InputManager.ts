import { addView, createCursorBuffer, CursorBuffer } from "../allocator/CursorBuffer";
import { copyToWriteBuffer, createTripleBuffer, swapWriteBuffer } from "../TripleBuffer";
import { flagGet, flagSet } from "./Bitmask";
import { Keys, codeToKeyCode } from "./KeyCodes";

export type InputState = {
  buffer: CursorBuffer;
  keyboard: Uint32Array;
  mouse: {
    movement: Float32Array;
    buttons: Uint32Array;
  };
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

      inputState.mouse.movement[0] = 0;
      inputState.mouse.movement[1] = 0;
    },
    dispose() {
      dispose();
    },
  };
}

export const createInputState = (buffer: CursorBuffer = createCursorBuffer()): InputState => {
  return {
    buffer,
    keyboard: addView(buffer, Uint32Array, Math.ceil(Keys.length / 32)),
    mouse: {
      movement: addView(buffer, Float32Array, 2),
      buttons: addView(buffer, Uint32Array, 1),
    },
  };
};

export const bindInputEvents = (inputState: InputState, canvas: HTMLElement): (() => void) => {
  function onMouseDown({ buttons }: MouseEvent) {
    if (document.pointerLockElement === canvas) {
      inputState.mouse.buttons[0] = buttons;
    } else {
      canvas.requestPointerLock();
    }
  }

  function onMouseUp({ buttons }: MouseEvent) {
    if (document.pointerLockElement === canvas) {
      inputState.mouse.buttons[0] = buttons;
    }
  }

  function onKeyDown({ code }: KeyboardEvent) {
    if (document.pointerLockElement === canvas) {
      flagSet(inputState.keyboard, codeToKeyCode(code), 1);
    }
  }

  function onKeyUp({ code }: KeyboardEvent) {
    if (document.pointerLockElement === canvas) {
      flagSet(inputState.keyboard, codeToKeyCode(code), 0);
    }
  }

  function onMouseMove({ movementX, movementY }: MouseEvent) {
    if (document.pointerLockElement === canvas) {
      inputState.mouse.movement[0] += movementX;
      inputState.mouse.movement[1] += movementY;
    }
  }

  function onBlur() {
    inputState.buffer.clear();
  }

  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mouseup", onMouseUp);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("blur", onBlur);

  return () => {
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("blur", onBlur);
  };
};

type InputStateGetter = (inputState: InputState) => number;

const keyIndexToInputState =
  (index: number): InputStateGetter =>
  (inputState: InputState) =>
    flagGet(inputState.keyboard, index);

const mouseMovementIndexToInputState =
  (index: number): InputStateGetter =>
  (inputState: InputState) =>
    inputState.mouse.movement[index];

const mouseButtonIndexToInputState =
  (index: number): InputStateGetter =>
  (inputState: InputState) =>
    flagGet(inputState.mouse.buttons, index);

export const InputStateGetters: { [path: string]: InputStateGetter } = Object.fromEntries([
  ...Keys.map((key, i) => [`Keyboard/${key}`, keyIndexToInputState(i)]),
  ["Mouse/movementX", mouseMovementIndexToInputState(0)],
  ["Mouse/movementY", mouseMovementIndexToInputState(1)],
  ...Array(6)
    .fill(0)
    .map((_, i) => [`Mouse/button${i}`, mouseButtonIndexToInputState(i)]),
]);
