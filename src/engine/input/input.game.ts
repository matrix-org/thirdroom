import { createCursorBuffer } from "../allocator/CursorBuffer";
import { getReadBufferIndex, swapReadBuffer, TripleBufferState } from "../allocator/TripleBuffer";
import { GameState, IInitialGameThreadState } from "../GameWorker";
import { defineModule, getModule } from "../module/module.common";
import { ActionMap, ActionState } from "./ActionMappingSystem";
import { createInputState, InputState, InputStateGetters } from "./input.common";

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
      // TODO: When we pass the cursor buffer from main thread to the game thread, it comes with the cursor buffer properties already set. We can remove this line entirely, but then in createInputState we add additional views. Somehow we need to reuse the same cursor buffer defs and input state views.
      // We could just postMessage the entire input state and avoid creating the cursor buffers altogether
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

export const InputReadSystem = (ctx: GameState) => {
  const input = getModule(ctx, InputModule);
  swapReadBuffer(input.tripleBuffer);
};
