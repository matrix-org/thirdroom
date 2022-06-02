import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import { availableRead } from "../ringbuffer/RingBuffer";
import { checkBitflag } from "../utils/checkBitflag";
import { ActionMap, ActionState } from "./ActionMappingSystem";
import { InitializeInputStateMessage, InputMessageType } from "./input.common";
import { KeyCodes, Keys } from "./KeyCodes";
import { dequeueInputRingBuffer, InputRingBuffer } from "./RingBuffer";

/*********
 * Types *
 ********/

export interface GameInputModuleState {
  inputRingBuffer: InputRingBuffer<Float32ArrayConstructor>;
  actions: Map<string, ActionState>;
  actionMaps: ActionMap[];
  raw: { [path: string]: number };
}

/******************
 * Initialization *
 *****************/

export const InputModule = defineModule<GameState, GameInputModuleState>({
  name: "input",
  async create(ctx, { waitForMessage }) {
    const { inputRingBuffer } = await waitForMessage<InitializeInputStateMessage>(
      Thread.Main,
      InputMessageType.InitializeInputState
    );
    return {
      inputRingBuffer,
      actions: new Map(),
      actionMaps: [],
      raw: {},
    };
  },
  init(ctx) {},
});

enum MouseButton {
  Left = 1 << 0,
  Right = 1 << 1,
  Middle = 1 << 2,
  Four = 1 << 3,
  Five = 1 << 4,
}

const out = { keyCode: 0, values: [] };
function applyMouseButtons(raw: { [path: string]: number }, o: typeof out) {
  const buttons = o.values[0];
  if (checkBitflag(buttons, MouseButton.Left)) {
    raw["Mouse/Left"] = 1;
  } else {
    raw["Mouse/Left"] = 0;
  }
  if (checkBitflag(buttons, MouseButton.Right)) {
    raw["Mouse/Right"] = 1;
  } else {
    raw["Mouse/Right"] = 0;
  }
  if (checkBitflag(buttons, MouseButton.Middle)) {
    raw["Mouse/Middle"] = 1;
  } else {
    raw["Mouse/Middle"] = 0;
  }
  if (checkBitflag(buttons, MouseButton.Four)) {
    raw["Mouse/Four"] = 1;
  } else {
    raw["Mouse/Four"] = 0;
  }
  if (checkBitflag(buttons, MouseButton.Five)) {
    raw["Mouse/Five"] = 1;
  } else {
    raw["Mouse/Five"] = 0;
  }
}

function applyMouseMovement(raw: { [path: string]: number }, o: typeof out) {
  raw["Mouse/movementX"] = o.values[0];
  raw["Mouse/movementY"] = o.values[1];
}

export function ApplyInputSystem(ctx: GameState) {
  const { inputRingBuffer, raw } = getModule(ctx, InputModule);
  while (availableRead(inputRingBuffer)) {
    dequeueInputRingBuffer(inputRingBuffer, out);
    switch (out.keyCode) {
      case KeyCodes.MouseButtons:
        applyMouseButtons(raw, out);
        break;
      case KeyCodes.MouseMovement:
        applyMouseMovement(raw, out);
        break;
      default:
        raw[`Keyboard/${Keys[out.keyCode]}`] = out.values[0];
    }
  }
}

export function ResetInputSystem(ctx: GameState) {
  const { raw } = getModule(ctx, InputModule);
  raw["Mouse/movementX"] = 0;
  raw["Mouse/movementY"] = 0;
}
