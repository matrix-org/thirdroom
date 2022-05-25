import { swapReadBuffer } from "../allocator/TripleBuffer";
import { getReadView, TripleBufferView } from "../allocator/TripleBufferView";
import { GameState, IInitialGameThreadState } from "../GameWorker";
import { defineModule, getModule } from "../module/module.common";
import { ActionMap, ActionState } from "./ActionMappingSystem";
import { InputState, InputStateGetters } from "./input.common";

/*********
 * Types *
 ********/

export interface GameInputModuleState {
  inputStateTripleBufferView: TripleBufferView<InputState>;
  actions: Map<string, ActionState>;
  actionMaps: ActionMap[];
  raw: { [path: string]: number };
}

/******************
 * Initialization *
 *****************/

const generateInputGetters = (inputStateTripleBufferView: TripleBufferView<InputState>): { [path: string]: number } =>
  Object.defineProperties(
    {},
    Object.fromEntries(
      Object.entries(InputStateGetters).map(([path, getter]) => [
        path,
        { enumerable: true, get: () => getter(getReadView(inputStateTripleBufferView)) },
      ])
    )
  );

export const InputModule = defineModule<GameState, IInitialGameThreadState, GameInputModuleState>({
  create({ inputStateTripleBufferView }): GameInputModuleState {
    return {
      inputStateTripleBufferView,
      actions: new Map(),
      actionMaps: [],
      raw: generateInputGetters(inputStateTripleBufferView),
    };
  },
  init(ctx) {},
});

/***********
 * Systems *
 **********/

export const InputReadSystem = (ctx: GameState) => {
  const input = getModule(ctx, InputModule);
  swapReadBuffer(input.inputStateTripleBufferView.tripleBuffer);

  // console.log(getReadView(input.inputStateTripleBufferView).mouse.movement);

  if (input.raw.KeyT) {
    console.log("pressed T");
  }
};
