import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, Thread } from "../module/module.common";
import { codeToKeyCode } from "./KeyCodes";
import { InitializeInputStateMessage, InputComponentId, InputMessageType, InputSourceId } from "./input.common";
import { createInputRingBuffer, enqueueInputRingBuffer, InputRingBuffer, RING_BUFFER_MAX } from "./RingBuffer";

/*********
 * Types *
 ********/

export interface MainInputModule {
  inputRingBuffer: InputRingBuffer;
}

/******************
 * Initialization *
 *****************/

export const InputModule = defineModule<IMainThreadContext, MainInputModule>({
  name: "input",
  create(ctx, { sendMessage }) {
    // TODO: optimize memory
    const inputRingBuffer = createInputRingBuffer(RING_BUFFER_MAX);

    sendMessage<InitializeInputStateMessage>(Thread.Game, InputMessageType.InitializeInputState, {
      inputRingBuffer,
    });

    sendMessage<InitializeInputStateMessage>(Thread.Render, InputMessageType.InitializeInputState, {
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

    function enqueue(
      inputSourceId: number,
      componentId: number,
      button: number,
      xAxis: number,
      yAxis: number,
      state: number
    ) {
      if (document.pointerLockElement !== canvas) {
        return;
      }

      if (!enqueueInputRingBuffer(irb, inputSourceId, componentId, button, xAxis, yAxis, state)) {
        console.warn("input ring buffer full");
      }
    }

    function onMouseDown({ buttons }: MouseEvent) {
      enqueue(InputSourceId.Mouse, InputComponentId.MouseButtons, 0, 0, 0, buttons);
    }

    function onMouseUp({ buttons }: MouseEvent) {
      enqueue(InputSourceId.Mouse, InputComponentId.MouseButtons, 0, 0, 0, buttons);
    }

    function onKeyDown({ code }: KeyboardEvent) {
      if (last[code]) return;
      last[code] = true;

      enqueue(InputSourceId.Keyboard, InputComponentId.KeyboardButton, 1, 0, 0, codeToKeyCode(code));
    }

    function onKeyUp({ code }: KeyboardEvent) {
      last[code] = false;
      enqueue(InputSourceId.Keyboard, InputComponentId.KeyboardButton, 0, 0, 0, codeToKeyCode(code));
    }

    function onMouseMove({ movementX, movementY }: MouseEvent) {
      enqueue(InputSourceId.Mouse, InputComponentId.MouseMovement, 0, movementX, movementY, 0);
    }

    function onWheel({ deltaX, deltaY }: WheelEvent) {
      enqueue(InputSourceId.Mouse, InputComponentId.MouseScroll, 0, deltaX, deltaY, 0);
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
