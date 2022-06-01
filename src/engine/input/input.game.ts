import { RingBuffer } from "ringbuf.js";

import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import { ActionMap, ActionState } from "./ActionMappingSystem";
import { InitializeInputStateMessage, InputMessageType } from "./input.common";
import { Keys } from "./KeyCodes";
import { createInputRingBuffer, dequeueInputRingBuffer, InputRingBuffer } from "./RingBuffer";

/*********
 * Types *
 ********/

export interface GameInputModuleState {
  inputRingBuffer: InputRingBuffer;
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
    const { inputRingBufferSab } = await waitForMessage<InitializeInputStateMessage>(
      Thread.Main,
      InputMessageType.InitializeInputState
    );
    const ringbuf = new RingBuffer(inputRingBufferSab, Float32Array as any);
    const inputRingBuffer = createInputRingBuffer(ringbuf);
    return {
      inputRingBuffer,
      actions: new Map(),
      actionMaps: [],
      raw: {},
    };
  },
  init(ctx) {},
});

const out = { keyCode: 0, value: 0 };
export function ApplyInputSystem(ctx: GameState) {
  const { inputRingBuffer, raw } = getModule(ctx, InputModule);
  while (inputRingBuffer.ringbuf.available_read()) {
    dequeueInputRingBuffer(inputRingBuffer, out);
    raw[Keys[out.keyCode]] = out.value;
  }
}

export function ResetInputSystem(ctx: GameState) {
  const { raw } = getModule(ctx, InputModule);
  raw["movementX"] = 0;
  raw["movementY"] = 0;
}
