import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, Thread } from "../module/module.common";
import { flagSet } from "./Bitmask";
import { codeToKeyCode } from "./KeyCodes";
import {
  InitializeInputStateMessage,
  InputMessageType,
  InputState,
  inputStateSchema,
  SharedInputState,
} from "./input.common";
import {
  clearObjectBufferView,
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";

/*********
 * Types *
 ********/

export interface InputModuleState {
  sharedInputState: SharedInputState;
  inputState: InputState;
}

/******************
 * Initialization *
 *****************/

export const InputModule = defineModule<IMainThreadContext, InputModuleState>({
  name: "input",
  create(ctx, { sendMessage }) {
    const inputState = createObjectBufferView(inputStateSchema, ArrayBuffer);
    const sharedInputState = createTripleBufferBackedObjectBufferView(
      inputStateSchema,
      inputState,
      ctx.gameToMainTripleBufferFlags
    );

    sendMessage<InitializeInputStateMessage>(Thread.Game, InputMessageType.InitializeInputState, { sharedInputState });

    return {
      sharedInputState,
      inputState,
    };
  },
  init(ctx) {
    const { inputState } = getModule(ctx, InputModule);
    const { canvas } = ctx;

    function onMouseDown({ buttons }: MouseEvent) {
      if (document.pointerLockElement === canvas) {
        inputState.mouseButtons[0] = buttons;
      } else {
        canvas.requestPointerLock();
      }
    }

    function onMouseUp({ buttons }: MouseEvent) {
      if (document.pointerLockElement === canvas) {
        inputState.mouseButtons[0] = buttons;
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
        inputState.mouseMovement[0] += movementX;
        inputState.mouseMovement[1] += movementY;
      }
    }

    function onBlur() {
      clearObjectBufferView(inputState);
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

  commitToTripleBufferView(input.sharedInputState);

  input.inputState.mouseMovement[0] = 0;
  input.inputState.mouseMovement[1] = 0;
}
