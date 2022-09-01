import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, Thread } from "../module/module.common";
import { codeToKeyCode, KeyCodes } from "./KeyCodes";
import { InitializeInputStateMessage, InputMessageType } from "./input.common";
import { createInputRingBuffer, enqueueInputRingBuffer, InputRingBuffer } from "./RingBuffer";

/*********
 * Types *
 ********/

export interface InputModuleState {
  inputRingBuffer: InputRingBuffer<Float32ArrayConstructor>;
}

/******************
 * Initialization *
 *****************/

// max ringbuffer items
const RING_BUFFER_MAX = 100;

export const InputModule = defineModule<IMainThreadContext, InputModuleState>({
  name: "input",
  create(ctx, { sendMessage }) {
    // TODO: optimize memory
    const inputRingBuffer = createInputRingBuffer(Float32Array, RING_BUFFER_MAX);

    sendMessage<InitializeInputStateMessage>(Thread.Game, InputMessageType.InitializeInputState, {
      inputRingBuffer,
    });

    return {
      inputRingBuffer,
    };
  },
  init(ctx) {
    const { inputRingBuffer } = getModule(ctx, InputModule);
    const { canvas } = ctx;

    const last: { [key: string]: boolean } = {};

    function onMouseDown({ buttons }: MouseEvent) {
      if (document.pointerLockElement === canvas) {
        if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.MouseButtons, buttons)) {
          console.warn("input ring buffer full");
        }
      }
    }

    function onMouseUp({ buttons }: MouseEvent) {
      if (document.pointerLockElement === canvas) {
        if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.MouseButtons, buttons)) {
          console.warn("input ring buffer full");
        }
      }
    }

    function onKeyDown({ code }: KeyboardEvent) {
      if (last[code]) return;
      last[code] = true;
      if (document.pointerLockElement === canvas) {
        if (!enqueueInputRingBuffer(inputRingBuffer, codeToKeyCode(code), 1)) {
          console.warn("input ring buffer full");
        }
      }
    }

    function onKeyUp({ code }: KeyboardEvent) {
      last[code] = false;
      if (document.pointerLockElement === canvas) {
        if (!enqueueInputRingBuffer(inputRingBuffer, codeToKeyCode(code), 0)) {
          console.warn("input ring buffer full");
        }
      }
    }

    function onMouseMove({ movementX, movementY }: MouseEvent) {
      if (document.pointerLockElement === canvas) {
        if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.MouseMovement, movementX, movementY)) {
          console.warn("input ring buffer full");
        }
      }
    }

    function onBlur() {}

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
