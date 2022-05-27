import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { defineModule } from "../module/module.common";
import { ActionMap, ActionState } from "./ActionMappingSystem";
import { InitializeInputStateMessage, InputMessageType, InputStateGetters, SharedInputState } from "./input.common";

/*********
 * Types *
 ********/

export interface GameInputModuleState {
  sharedInputState: SharedInputState;
  actions: Map<string, ActionState>;
  actionMaps: ActionMap[];
  raw: { [path: string]: number };
}

/******************
 * Initialization *
 *****************/

const generateInputGetters = (sharedInputState: SharedInputState): { [path: string]: number } =>
  Object.defineProperties(
    {},
    Object.fromEntries(
      Object.entries(InputStateGetters).map(([path, getter]) => [
        path,
        { enumerable: true, get: () => getter(getReadObjectBufferView(sharedInputState)) },
      ])
    )
  );

export const InputModule = defineModule<GameState, GameInputModuleState>({
  name: "input",
  async create(ctx, { waitForMessage }) {
    const { sharedInputState } = await waitForMessage<InitializeInputStateMessage>(
      InputMessageType.InitializeInputState
    );
    return {
      sharedInputState,
      actions: new Map(),
      actionMaps: [],
      raw: generateInputGetters(sharedInputState),
    };
  },
  init(ctx) {},
});
