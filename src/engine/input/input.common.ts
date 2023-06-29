import { InputRingBuffer } from "../common/InputRingBuffer";

export enum InputMessageType {
  InitializeInputState = "initialize-input-state",
}

export interface InitializeInputStateMessage {
  inputRingBuffer: InputRingBuffer;
}

// Additional input source ids allocated by XRInputModule
export const InputSourceId = {
  Unknown: 0,
  Keyboard: 1,
  Mouse: 2,
};

// Additional component ids allocated by XRInputModule
export enum InputComponentId {
  Unknown,
  MouseMovement,
  MouseButtons,
  MouseScroll,
  KeyboardButton,
  XRFaceButton,
  XRStandardTrigger,
  XRStandardSqueeze,
  XRStandardThumbstick,
  XRStandardTouchpad,
  XRHandGrasp,
  XRTouchpad,
  XRTouchscreen,
  XRXButton,
  XRYButton,
  XRAButton,
  XRBButton,
  XRBumper,
  XRThumbrest,
  XRMenu,
}

export enum XRInputComponentId {
  FaceButton = "face-button",
  XRStandardTrigger = "xr-standard-trigger",
  XRStandardSqueeze = "xr-standard-squeeze",
  XRStandardThumbstick = "xr-standard-thumbstick",
  XRStandardTouchpad = "xr-standard-touchpad",
  Grasp = "grasp",
  Touchpad = "touchpad",
  Touchscreen = "touchscreen",
  XButton = "x-button",
  YButton = "y-button",
  AButton = "a-button",
  BButton = "b-button",
  Bumper = "bumper",
  Thumbrest = "thumbrest",
  Menu = "menu",
}

export interface InputComponentState {
  inputSourceId: number;
  componentId: number;
  button: number; // 0 to 1
  xAxis: number; // -1 to 1
  yAxis: number; // -1 to 1
  zAxis: number; // -Infinity to Infinity
  wAxis: number; // -Infinity to Infinity
  // Component specific state
  // For XRInput this is XRInputComponentStateValue
  // For MouseInput this is the buttons bitmask
  // For KeyboardInput this is the keycode
  state: number;
}
