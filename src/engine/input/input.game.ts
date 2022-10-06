import { availableRead } from "@thirdroom/ringbuffer";

import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import { isHost } from "../network/network.common";
import { NetworkModule } from "../network/network.game";
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
  Scroll = 1 << 5,
}

const out: { keyCode: number; values: [number, number] } = { keyCode: 0, values: [0, 0] };
export function applyMouseButtons(raw: { [path: string]: number }, o: typeof out) {
  const buttons = o.values[0];
  raw["Mouse/Left"] = checkBitflag(buttons, MouseButton.Left) ? 1 : 0;
  raw["Mouse/Right"] = checkBitflag(buttons, MouseButton.Right) ? 1 : 0;
  raw["Mouse/Middle"] = checkBitflag(buttons, MouseButton.Middle) ? 1 : 0;
  raw["Mouse/Four"] = checkBitflag(buttons, MouseButton.Four) ? 1 : 0;
  raw["Mouse/Five"] = checkBitflag(buttons, MouseButton.Five) ? 1 : 0;
  raw["Mouse/Scroll"] = checkBitflag(buttons, MouseButton.Five) ? 1 : 0;
}

export function applyMouseMovement(raw: { [path: string]: number }, o: typeof out) {
  raw["Mouse/movementX"] = o.values[0];
  raw["Mouse/movementY"] = o.values[1];
}

export function applyMouseScroll(raw: { [path: string]: number }, o: typeof out) {
  raw["Mouse/Scroll"] = o.values[0];
}

export function ApplyInputSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  const { inputRingBuffer, raw } = getModule(ctx, InputModule);
  while (availableRead(inputRingBuffer)) {
    const command = dequeueInputRingBuffer(inputRingBuffer, out);
    if (!command) continue;

    if (!isHost(network)) {
      // collect commands to send to host
      network.commands.push(command);

      // skip applying inputs if we aren't hosting and client-side prediction is off
      if (!network.clientSidePrediction) {
        continue;
      }
    }

    switch (out.keyCode) {
      case KeyCodes.MouseButtons:
        applyMouseButtons(raw, out);
        break;
      case KeyCodes.MouseMovement:
        applyMouseMovement(raw, out);
        break;
      case KeyCodes.MouseScroll:
        applyMouseScroll(raw, out);
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
  raw["Mouse/Scroll"] = 0;
}
