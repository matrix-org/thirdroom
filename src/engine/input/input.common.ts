import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { InputRingBuffer } from "./RingBuffer";
import { XRInputComponentId, XRInputLayout } from "./WebXRInputProfiles";

export enum InputMessageType {
  InitializeInputState = "initialize-input-state",
  UpdateXRInputSources = "update-xr-input-sources",
}

export interface InitializeInputStateMessage {
  inputRingBuffer: InputRingBuffer;
}

export const XRControllerPosesSchema = defineObjectBufferSchema({
  rayPose: [Float32Array, 16],
  gripPose: [Float32Array, 16],
});

// https://www.w3.org/TR/webxr-hand-input-1/#skeleton-joints
export const XRHandPosesSchema = defineObjectBufferSchema({
  matrices: [Float32Array, 16, 24],
  radii: [Float32Array, 24],
});

export type XRControllerPosesTripleBuffer = ObjectTripleBuffer<typeof XRControllerPosesSchema>;
export type XRHandPosesTripleBuffer = ObjectTripleBuffer<typeof XRHandPosesSchema>;

export interface SharedXRInputSource {
  id: number;
  handedness: XRHandedness;
  layout: XRInputLayout;
  controllerPoses: XRControllerPosesTripleBuffer;
  handPoses?: XRHandPosesTripleBuffer;
}

export interface UpdateXRInputSourcesMessage {
  type: InputMessageType.UpdateXRInputSources;
  added: SharedXRInputSource[];
  removed: number[];
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

export const XRToInputComponentId = {
  [XRInputComponentId.FaceButton]: InputComponentId.XRFaceButton,
  [XRInputComponentId.XRStandardTrigger]: InputComponentId.XRStandardTrigger,
  [XRInputComponentId.XRStandardSqueeze]: InputComponentId.XRStandardSqueeze,
  [XRInputComponentId.XRStandardThumbstick]: InputComponentId.XRStandardThumbstick,
  [XRInputComponentId.XRStandardTouchpad]: InputComponentId.XRStandardTouchpad,
  [XRInputComponentId.Grasp]: InputComponentId.XRHandGrasp,
  [XRInputComponentId.Touchpad]: InputComponentId.XRTouchpad,
  [XRInputComponentId.Touchscreen]: InputComponentId.XRTouchscreen,
  [XRInputComponentId.XButton]: InputComponentId.XRXButton,
  [XRInputComponentId.YButton]: InputComponentId.XRYButton,
  [XRInputComponentId.AButton]: InputComponentId.XRAButton,
  [XRInputComponentId.BButton]: InputComponentId.XRBButton,
  [XRInputComponentId.Bumper]: InputComponentId.XRBumper,
  [XRInputComponentId.Thumbrest]: InputComponentId.XRThumbrest,
  [XRInputComponentId.Menu]: InputComponentId.XRMenu,
};

export const XRInputComponentIdToName: { [key: number]: XRInputComponentId } = {
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

export interface InputComponentState {
  inputSourceId: number;
  componentId: number;
  button: number; // 0 to 1
  xAxis: number; // -1 to 1
  yAxis: number; // -1 to 1
  // Component specific state
  // For XRInput this is XRInputComponentStateValue
  // For MouseInput this is the buttons bitmask
  // For KeyboardInput this is the keycode
  state: number;
}
