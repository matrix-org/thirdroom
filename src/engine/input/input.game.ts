import { availableRead } from "@thirdroom/ringbuffer";

import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { checkBitflag } from "../utils/checkBitflag";
import { createDisposables } from "../utils/createDisposables";
import {
  InitializeInputStateMessage,
  InputComponentId,
  InputComponentState,
  InputMessageType,
  SharedXRInputSource,
  UpdateXRInputSourcesMessage,
  XRInputComponentIdToName,
} from "./input.common";
import {
  InputController,
  createInputController,
  InputControllerComponent,
  exitedInputControllerQuery,
  removeInputController,
} from "./InputController";
import { Keys } from "./KeyCodes";
import { dequeueInputRingBuffer } from "./RingBuffer";

/*********
 * Types *
 ********/

export interface GameInputModule {
  controllers: Map<number, InputController>;
  defaultController: InputController;
  activeController: InputController;
  xrInputSources: SharedXRInputSource[];
  xrPrimaryHand: XRHandedness;
}

/******************
 * Initialization *
 *****************/

export const InputModule = defineModule<GameState, GameInputModule>({
  name: "input",
  async create(ctx, { waitForMessage }) {
    const { inputRingBuffer } = await waitForMessage<InitializeInputStateMessage>(
      Thread.Main,
      InputMessageType.InitializeInputState
    );

    const controller = createInputController({ inputRingBuffer });

    return {
      controllers: InputControllerComponent,
      defaultController: controller,
      activeController: controller,
      xrInputSources: [],
      xrPrimaryHand: "right",
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, InputMessageType.UpdateXRInputSources, onUpdateXRInputSources),
    ]);
  },
});

function onUpdateXRInputSources(ctx: GameState, { added, removed }: UpdateXRInputSourcesMessage) {
  const { xrInputSources } = getModule(ctx, InputModule);

  for (const id of removed) {
    const index = xrInputSources.findIndex((item) => item.id === id);

    if (index === -1) {
      xrInputSources.splice(index, 1);
    }
  }

  for (const item of added) {
    xrInputSources.push(item);
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

const out: InputComponentState = { inputSourceId: 0, componentId: 0, button: 0, xAxis: 0, yAxis: 0, state: 0 };

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
  inputSources: SharedXRInputSource[],
  primaryHand: XRHandedness
) {
  const inputSource = inputSources.find((source) => source.id === o.inputSourceId);

  if (!inputSource) {
    console.warn("Couldn't find XR input source");
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
  inputSources: SharedXRInputSource[],
  primaryHand: XRHandedness
) {
  const inputSource = inputSources.find((source) => source.id === o.inputSourceId);

  if (!inputSource) {
    console.warn("Couldn't find XR input source");
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

  // TODO: Read poses on game thread
  // for (const item of xrInputSources) {

  // }
}

/**********
 * System *
 **********/

export function ResetInputSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  for (const controller of input.controllers.values()) {
    const { raw } = controller;
    raw["Mouse/movementX"] = 0;
    raw["Mouse/movementY"] = 0;
    raw["Mouse/Scroll"] = 0;
  }
}
