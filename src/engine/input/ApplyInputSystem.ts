import { availableRead } from "@thirdroom/ringbuffer";

import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { InputComponentId, InputComponentState, SharedXRInputSource, XRInputComponentIdToName } from "./input.common";
import { exitedInputControllerQuery, removeInputController } from "./InputController";
import { dequeueInputRingBuffer } from "./RingBuffer";
import { InputModule } from "./input.game";
import { checkBitflag } from "../utils/checkBitflag";
import { Keys } from "./KeyCodes";

const out: InputComponentState = { inputSourceId: 0, componentId: 0, button: 0, xAxis: 0, yAxis: 0, state: 0 };

export function ApplyInputSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  const { activeController, xrInputSources, xrPrimaryHand } = input;
  const { inputRingBuffer, raw } = activeController;

  while (availableRead(inputRingBuffer)) {
    dequeueInputRingBuffer(inputRingBuffer, out);

    switch (out.componentId) {
      case InputComponentId.MouseButtons:
        applyMouseButtons(raw, out);
        break;
      case InputComponentId.MouseMovement:
        applyMouseMovement(raw, out);
        break;
      case InputComponentId.MouseScroll:
        applyMouseScroll(raw, out);
        break;
      case InputComponentId.KeyboardButton:
        applyKeyboardButton(raw, out);
        break;
      // TODO: Refactor to use componentType not componentId
      case InputComponentId.XRFaceButton:
      case InputComponentId.XRAButton:
      case InputComponentId.XRBButton:
      case InputComponentId.XRXButton:
      case InputComponentId.XRYButton:
      case InputComponentId.XRBumper:
      case InputComponentId.XRThumbrest:
      case InputComponentId.XRMenu:
        applyXRButton(raw, out, xrInputSources, xrPrimaryHand);
        break;
      case InputComponentId.XRStandardTrigger:
      case InputComponentId.XRHandGrasp:
        applyXRButton(raw, out, xrInputSources, xrPrimaryHand);
        break;
      case InputComponentId.XRStandardSqueeze:
        applyXRButton(raw, out, xrInputSources, xrPrimaryHand);
        break;
      case InputComponentId.XRStandardThumbstick:
        applyXRThumbstick(raw, out, xrInputSources, xrPrimaryHand);
        break;
      case InputComponentId.XRStandardTouchpad:
      case InputComponentId.XRTouchpad:
      case InputComponentId.XRTouchscreen:
        applyXRThumbstick(raw, out, xrInputSources, xrPrimaryHand);
        break;
    }
  }

  const exited = exitedInputControllerQuery(ctx.world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    removeInputController(ctx.world, input, eid);
  }
}

enum MouseButton {
  Left = 1 << 0,
  Right = 1 << 1,
  Middle = 1 << 2,
  Four = 1 << 3,
  Five = 1 << 4,
  Scroll = 1 << 5,
}

function applyMouseButtons(raw: { [path: string]: number }, o: InputComponentState) {
  const buttons = o.state;
  raw["Mouse/Left"] = checkBitflag(buttons, MouseButton.Left) ? 1 : 0;
  raw["Mouse/Right"] = checkBitflag(buttons, MouseButton.Right) ? 1 : 0;
  raw["Mouse/Middle"] = checkBitflag(buttons, MouseButton.Middle) ? 1 : 0;
  raw["Mouse/Four"] = checkBitflag(buttons, MouseButton.Four) ? 1 : 0;
  raw["Mouse/Five"] = checkBitflag(buttons, MouseButton.Five) ? 1 : 0;
}

function applyMouseMovement(raw: { [path: string]: number }, o: InputComponentState) {
  raw["Mouse/movementX"] = o.xAxis;
  raw["Mouse/movementY"] = o.yAxis;
}

function applyMouseScroll(raw: { [path: string]: number }, o: InputComponentState) {
  // TODO: Split into x and y axes
  raw["Mouse/Scroll"] = o.yAxis;
}

function applyKeyboardButton(raw: { [path: string]: number }, o: InputComponentState) {
  raw[`Keyboard/${Keys[out.state]}`] = o.button;
}

function applyXRButton(
  raw: { [path: string]: number },
  o: InputComponentState,
  inputSources: Map<number, SharedXRInputSource>,
  primaryHand: XRHandedness
) {
  const inputSource = inputSources.get(o.inputSourceId);

  if (!inputSource) {
    return;
  }

  const handedness = inputSource.handedness;
  const componentName = XRInputComponentIdToName[o.componentId];

  raw[`XRInputSource/${handedness}/${componentName}`] = o.button;

  if (handedness === primaryHand) {
    raw[`XRInputSource/primary/${componentName}`] = o.button;
  } else if (handedness !== "none") {
    raw[`XRInputSource/secondary/${componentName}`] = o.button;
  }
}

function applyXRThumbstick(
  raw: { [path: string]: number },
  o: InputComponentState,
  inputSources: Map<number, SharedXRInputSource>,
  primaryHand: XRHandedness
) {
  const inputSource = inputSources.get(o.inputSourceId);

  if (!inputSource) {
    return;
  }

  const handedness = inputSource.handedness;
  const componentName = XRInputComponentIdToName[o.componentId];

  raw[`XRInputSource/${handedness}/${componentName}/button`] = o.button;
  raw[`XRInputSource/${handedness}/${componentName}/x-axis`] = o.xAxis;
  raw[`XRInputSource/${handedness}/${componentName}/y-axis`] = o.yAxis;
  raw[`XRInputSource/${handedness}/${componentName}/state`] = o.state;

  if (handedness === primaryHand) {
    raw[`XRInputSource/primary/${componentName}/button`] = o.button;
    raw[`XRInputSource/primary/${componentName}/x-axis`] = o.xAxis;
    raw[`XRInputSource/primary/${componentName}/y-axis`] = o.yAxis;
    raw[`XRInputSource/primary/${componentName}/state`] = o.state;
  } else if (handedness !== "none") {
    raw[`XRInputSource/secondary/${componentName}/button`] = o.button;
    raw[`XRInputSource/secondary/${componentName}/x-axis`] = o.xAxis;
    raw[`XRInputSource/secondary/${componentName}/y-axis`] = o.yAxis;
    raw[`XRInputSource/secondary/${componentName}/state`] = o.state;
  }
}
