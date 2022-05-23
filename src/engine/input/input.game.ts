import { createCursorBuffer, CursorBuffer } from "../allocator/CursorBuffer";
import {
  copyToWriteBuffer,
  createTripleBuffer,
  swapReadBuffer,
  swapWriteBuffer,
  TripleBufferState,
} from "../allocator/TripleBuffer";
import { GameState, IInitialGameThreadState } from "../GameWorker";
import { defineModule, getModule, registerSystem } from "../module/module.common";
import { flagSet } from "./Bitmask";
import { createInputState } from "./input.common";
import { codeToKeyCode } from "./KeyCodes";

/*********
 * Types *
 ********/

export interface GameInputModuleState {
  tripleBuffer: TripleBufferState;
  inputStates: InputState[];
  actions: Map<string, ActionState>;
  actionMaps: ActionMap[];
  raw: { [path: string]: number };
}

/******************
 * Initialization *
 *****************/

const generateInputGetters = (
  inputStates: InputState[],
  inputTripleBuffer: TripleBufferState
): { [path: string]: number } =>
  Object.defineProperties(
    {},
    Object.fromEntries(
      Object.entries(InputStateGetters).map(([path, getter]) => [
        path,
        { enumerable: true, get: () => getter(inputStates[getReadBufferIndex(inputTripleBuffer)]) },
      ])
    )
  );

export const InputModule = defineModule<GameState, IInitialGameThreadState, GameInputModuleState>({
  create({ inputTripleBuffer }): GameInputModuleState {
    const inputStates = inputTripleBuffer.buffers
      .map((buffer) => createCursorBuffer(buffer))
      .map((buffer) => createInputState(buffer));

    return {
      tripleBuffer: inputTripleBuffer,
      inputStates,
      actions: new Map(),
      actionMaps: [],
      raw: generateInputGetters(inputStates, inputTripleBuffer),
    };
  },
  init(ctx) {},
});

/***********
 * Systems *
 **********/

export const inputReadSystem = (ctx: GameState) => {
  const input = getModule(ctx, InputModule);
  swapReadBuffer(input.tripleBuffer);
};
