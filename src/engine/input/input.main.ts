import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, Thread } from "../module/module.common";
import { codeToKeyCode, KeyCodes } from "./KeyCodes";
import { InitializeInputStateMessage, InputMessageType } from "./input.common";
import { createInputRingBuffer, enqueueInputRingBuffer, InputRingBuffer } from "./RingBuffer";
import { createRingBuffer } from "../ringbuffer/RingBuffer";

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
    // const inputRingBufferSab = RingBuffer.getStorageForCapacity(MAX_ITEMS, Float32Array);
    // const inputRingBuffer = createInputRingBuffer(new RingBuffer(inputRingBufferSab, Float32Array as any));
    const ringBuffer = createRingBuffer(Float32Array, RING_BUFFER_MAX);
    const inputRingBuffer = createInputRingBuffer(ringBuffer);

    console.log(ringBuffer);

    sendMessage<InitializeInputStateMessage>(Thread.Game, InputMessageType.InitializeInputState, {
      ringBuffer,
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
        switch (buttons) {
          case 1:
            if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.Mouse1, 1)) {
              console.warn("input ring buffer full");
            }
            break;
          case 2:
            if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.Mouse2, 1)) {
              console.warn("input ring buffer full");
            }
            break;
          case 4:
            if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.Mouse3, 1)) {
              console.warn("input ring buffer full");
            }
            break;
          case 8:
            if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.Mouse4, 1)) {
              console.warn("input ring buffer full");
            }
            break;
          case 16:
            if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.Mouse5, 1)) {
              console.warn("input ring buffer full");
            }
            break;
        }
      } else {
        canvas.requestPointerLock();
      }
    }

    function onMouseUp({ buttons }: MouseEvent) {
      if (document.pointerLockElement === canvas) {
        switch (buttons) {
          case 1:
            if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.Mouse1, 0)) {
              console.warn("input ring buffer full");
            }
            break;
          case 2:
            if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.Mouse2, 0)) {
              console.warn("input ring buffer full");
            }
            break;
          case 4:
            if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.Mouse3, 0)) {
              console.warn("input ring buffer full");
            }
            break;
          case 8:
            if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.Mouse4, 0)) {
              console.warn("input ring buffer full");
            }
            break;
          case 16:
            if (!enqueueInputRingBuffer(inputRingBuffer, KeyCodes.Mouse5, 0)) {
              console.warn("input ring buffer full");
            }
            break;
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
        if (
          !enqueueInputRingBuffer(inputRingBuffer, KeyCodes.movementX, movementX) ||
          !enqueueInputRingBuffer(inputRingBuffer, KeyCodes.movementY, movementY)
        ) {
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
