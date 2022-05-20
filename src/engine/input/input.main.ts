import { addView, createCursorBuffer, CursorBuffer } from "../allocator/CursorBuffer";
import { MainThreadState } from "../MainThread";
import { copyToWriteBuffer, createTripleBuffer, swapWriteBuffer, TripleBufferState } from "../TripleBuffer";
import { flagGet, flagSet } from "./Bitmask";
import { Keys, codeToKeyCode } from "./KeyCodes";

export interface MainThreadInputState {
  tripleBuffer: TripleBufferState;
  buffer: CursorBuffer;
  keyboard: Uint32Array;
  mouse: {
    movement: Float32Array;
    buttons: Uint32Array;
  };
  dispose?: () => void;
}

export default {
  create() {
    const buffer = createCursorBuffer();
    const tripleBuffer = createTripleBuffer(buffer.byteLength);

    return {
      buffer,
      tripleBuffer,
      keyboard: addView(buffer, Uint32Array, Math.ceil(Keys.length / 32)),
      mouse: {
        movement: addView(buffer, Float32Array, 2),
        buttons: addView(buffer, Uint32Array, 1),
      },
    };
  },
  async init(state: MainThreadState) {
    state.input.dispose = bindInputEvents(state.input, state.canvas);
    state.systems.push(MainThreadInputSystem);
  },
  dispose(state: MainThreadState) {
    if (state.input.dispose) {
      state.input.dispose();
    }
  },
};

function MainThreadInputSystem(state: MainThreadState) {
  copyToWriteBuffer(state.input.tripleBuffer, state.input.buffer);
  swapWriteBuffer(state.input.tripleBuffer);

  state.input.mouse.movement[0] = 0;
  state.input.mouse.movement[1] = 0;
}

const bindInputEvents = (inputState: MainThreadInputState, canvas: HTMLElement): (() => void) => {
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

type InputStateGetter = (inputState: MainThreadInputState) => number;

const keyIndexToInputState =
  (index: number): InputStateGetter =>
  (inputState: MainThreadInputState) =>
    flagGet(inputState.keyboard, index);

const mouseMovementIndexToInputState =
  (index: number): InputStateGetter =>
  (inputState: MainThreadInputState) =>
    inputState.mouse.movement[index];

const mouseButtonIndexToInputState =
  (index: number): InputStateGetter =>
  (inputState: MainThreadInputState) =>
    flagGet(inputState.mouse.buttons, index);

export const InputStateGetters: { [path: string]: InputStateGetter } = Object.fromEntries([
  ...Keys.map((key, i) => [`Keyboard/${key}`, keyIndexToInputState(i)]),
  ["Mouse/movementX", mouseMovementIndexToInputState(0)],
  ["Mouse/movementY", mouseMovementIndexToInputState(1)],
  ...Array(6)
    .fill(0)
    .map((_, i) => [`Mouse/button${i}`, mouseButtonIndexToInputState(i)]),
]);
