import { IInitialMainThreadState, IMainThreadContext } from "../MainThread";
import { copyToWriteBuffer, swapWriteBuffer } from "../allocator/TripleBuffer";
import { defineModule, getModule } from "../module/module.common";
import { flagSet } from "./Bitmask";
import { codeToKeyCode } from "./KeyCodes";
import { createInputStateTripleBufferView, createInputStateView, InputState } from "./input.common";
import { TripleBufferView } from "../allocator/TripleBufferView";
import { CursorBufferView } from "../allocator/CursorBufferView";
import { clearCursorBufferView, getBuffer } from "../allocator/CursorBufferView";

/*********
 * Types *
 ********/

export interface InputModuleState {
  inputStateTripleBufferView: TripleBufferView<InputState>;
  inputState: CursorBufferView<InputState>;
}

/******************
 * Initialization *
 *****************/

export const InputModule = defineModule<IMainThreadContext, IInitialMainThreadState, InputModuleState>({
  create() {
    const inputStateTripleBufferView = createInputStateTripleBufferView();
    const inputState = createInputStateView();

    return {
      inputStateTripleBufferView,
      inputState,
    };
  },
  init(ctx) {
    const { inputStateTripleBufferView, inputState } = getModule(ctx, InputModule);

    ctx.initialGameWorkerState.inputStateTripleBufferView = inputStateTripleBufferView;

    const { canvas } = ctx;

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
      clearCursorBufferView(inputState);
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
  },
});

/***********
 * Systems *
 **********/

export function MainThreadInputSystem(ctx: IMainThreadContext) {
  const input = getModule(ctx, InputModule);
  copyToWriteBuffer(input.inputStateTripleBufferView.tripleBuffer, getBuffer(input.inputState));
  swapWriteBuffer(input.inputStateTripleBufferView.tripleBuffer);

  input.inputState.mouse.movement[0] = 0;
  input.inputState.mouse.movement[1] = 0;
}
