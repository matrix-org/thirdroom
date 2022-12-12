import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, Thread } from "../module/module.common";
import { codeToKeyCode, KeyCodes } from "./KeyCodes";
import { InitializeInputStateMessage, InputMessageType } from "./input.common";
import { createInputRingBuffer, enqueueInputRingBuffer, InputRingBuffer, RING_BUFFER_MAX } from "./RingBuffer";

/*********
 * Types *
 ********/

export interface MainInputModule {
  inputRingBuffer: InputRingBuffer<Float32ArrayConstructor>;
}

/******************
 * Initialization *
 *****************/

export const InputModule = defineModule<IMainThreadContext, MainInputModule>({
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
    const { inputRingBuffer: irb } = getModule(ctx, InputModule);
    const { canvas } = ctx;

    const last: { [key: string]: boolean } = {};

    function enqueue(keyCode: number, ...values: number[]) {
      if (document.pointerLockElement !== canvas) {
        return;
      }

      if (!enqueueInputRingBuffer(irb, keyCode, ...values)) {
        console.warn("input ring buffer full");
      }
    }

    function onMouseDown({ buttons }: MouseEvent) {
      enqueue(KeyCodes.MouseButtons, buttons);
    }

    function onMouseUp({ buttons }: MouseEvent) {
      enqueue(KeyCodes.MouseButtons, buttons);
    }

    function onKeyDown({ code }: KeyboardEvent) {
      if (last[code]) return;
      last[code] = true;
      enqueue(codeToKeyCode(code), 1);
    }

    function onKeyUp({ code }: KeyboardEvent) {
      last[code] = false;
      enqueue(codeToKeyCode(code), 0);
    }

    function onMouseMove({ movementX, movementY }: MouseEvent) {
      enqueue(KeyCodes.MouseMovement, movementX, movementY);
    }

    function onWheel({ deltaY }: WheelEvent) {
      enqueue(KeyCodes.MouseScroll, deltaY);
    }

    function onBlur() {}

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("blur", onBlur);
    canvas.addEventListener("wheel", onWheel);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("blur", onBlur);
      canvas.removeEventListener("wheel", onWheel);
    };
  },
});
