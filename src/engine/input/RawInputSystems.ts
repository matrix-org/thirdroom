import { availableRead } from "@thirdroom/ringbuffer";

import { GameContext } from "../GameTypes";
import { getModule } from "../module/module.common";
import { InputComponentId, InputComponentState, XRInputComponentId } from "./input.common";
import { dequeueInputRingBuffer } from "../common/InputRingBuffer";
import { InputModule } from "./input.game";
import { checkBitflag } from "../utils/checkBitflag";
import { Keys } from "./KeyCodes";
import { SharedXRInputSource } from "../renderer/renderer.common";
import { RendererModule } from "../renderer/renderer.game";

const out: InputComponentState = {
  inputSourceId: 0,
  componentId: 0,
  button: 0,
  xAxis: 0,
  yAxis: 0,
  zAxis: 0,
  wAxis: 0,
  state: 0,
};

/**
 * Pull input events from the ring buffer and apply them to the raw input state.
 * `out` is a temporary object that is reused for each input event and represents
 * an item in the ring buffer.
 */
export function UpdateRawInputSystem(ctx: GameContext) {
  const { inputRingBuffer, raw } = getModule(ctx, InputModule);
  const { xrInputSources, xrPrimaryHand } = getModule(ctx, RendererModule);

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
}

/**
 * Resets per-frame input state.
 */
export function ResetRawInputSystem(ctx: GameContext) {
  const { raw } = getModule(ctx, InputModule);
  raw["Mouse/movementX"] = 0;
  raw["Mouse/movementY"] = 0;
  raw["Mouse/Scroll"] = 0;
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
  raw["Mouse/screenX"] = o.zAxis;
  raw["Mouse/screenY"] = o.wAxis;
}

function applyMouseScroll(raw: { [path: string]: number }, o: InputComponentState) {
  // TODO: Split into x and y axes
  raw["Mouse/Scroll"] = o.yAxis;
}

function applyKeyboardButton(raw: { [path: string]: number }, o: InputComponentState) {
  raw[`Keyboard/${Keys[out.state]}`] = o.button;
}

const XRInputComponentIdToName: { [key: number]: XRInputComponentId } = {
  [InputComponentId.XRFaceButton]: XRInputComponentId.FaceButton,
  [InputComponentId.XRStandardTrigger]: XRInputComponentId.XRStandardTrigger,
  [InputComponentId.XRStandardSqueeze]: XRInputComponentId.XRStandardSqueeze,
  [InputComponentId.XRStandardThumbstick]: XRInputComponentId.XRStandardThumbstick,
  [InputComponentId.XRStandardTouchpad]: XRInputComponentId.XRStandardTouchpad,
  [InputComponentId.XRHandGrasp]: XRInputComponentId.Grasp,
  [InputComponentId.XRTouchpad]: XRInputComponentId.Touchpad,
  [InputComponentId.XRTouchscreen]: XRInputComponentId.Touchscreen,
  [InputComponentId.XRXButton]: XRInputComponentId.XButton,
  [InputComponentId.XRYButton]: XRInputComponentId.YButton,
  [InputComponentId.XRAButton]: XRInputComponentId.AButton,
  [InputComponentId.XRBButton]: XRInputComponentId.BButton,
  [InputComponentId.XRBumper]: XRInputComponentId.Bumper,
  [InputComponentId.XRThumbrest]: XRInputComponentId.Thumbrest,
  [InputComponentId.XRMenu]: XRInputComponentId.Menu,
};

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
