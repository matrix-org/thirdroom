import { createCursorBuffer, CursorBuffer } from "../allocator/CursorBuffer";
import { IInitialMainThreadState, IMainThreadContext } from "../MainThread";
import { copyToWriteBuffer, createTripleBuffer, swapWriteBuffer, TripleBufferState } from "../allocator/TripleBuffer";
import { defineModule, getModule, registerSystem } from "../module/module.common";
import { flagSet } from "./Bitmask";
import { createInputState } from "./input.common";
import { codeToKeyCode } from "./KeyCodes";

/*********
 * Types *
 ********/

export interface InputModuleState {
  tripleBuffer: TripleBufferState;
  buffer: CursorBuffer;
  keyboard: Uint32Array;
  mouse: {
    movement: Float32Array;
    buttons: Uint32Array;
  };
}

/******************
 * Initialization *
 *****************/

export const InputModule = defineModule<IMainThreadContext, IInitialMainThreadState, InputModuleState>({
  create() {
    const buffer = createCursorBuffer();
    const tripleBuffer = createTripleBuffer(buffer.byteLength);
    const inputState = createInputState(buffer);

    return {
      tripleBuffer,
      ...inputState,
    };
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);

    ctx.initialGameWorkerState.inputTripleBuffer = input.tripleBuffer;

    const { canvas } = ctx;

    function onMouseDown({ buttons }: MouseEvent) {
      if (document.pointerLockElement === canvas) {
        input.mouse.buttons[0] = buttons;
      } else {
        canvas.requestPointerLock();
      }
    }

    function onMouseUp({ buttons }: MouseEvent) {
      if (document.pointerLockElement === canvas) {
        input.mouse.buttons[0] = buttons;
      }
    }

    function onKeyDown({ code }: KeyboardEvent) {
      if (document.pointerLockElement === canvas) {
        flagSet(input.keyboard, codeToKeyCode(code), 1);
      }
    }

    function onKeyUp({ code }: KeyboardEvent) {
      if (document.pointerLockElement === canvas) {
        flagSet(input.keyboard, codeToKeyCode(code), 0);
      }
    }

    function onMouseMove({ movementX, movementY }: MouseEvent) {
      if (document.pointerLockElement === canvas) {
        input.mouse.movement[0] += movementX;
        input.mouse.movement[1] += movementY;
      }
    }

    function onBlur() {
      input.buffer.clear();
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("blur", onBlur);

    const disposeInputSystem = registerSystem(ctx, MainThreadInputSystem);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("blur", onBlur);
      disposeInputSystem();
    };
  },
});

/***********
 * Systems *
 **********/

function MainThreadInputSystem(ctx: IMainThreadContext) {
  const input = getModule(ctx, InputModule);
  copyToWriteBuffer(input.tripleBuffer, input.buffer);
  swapWriteBuffer(input.tripleBuffer);

  input.mouse.movement[0] = 0;
  input.mouse.movement[1] = 0;
}
