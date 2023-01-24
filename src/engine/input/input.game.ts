import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import {
  InitializeInputStateMessage,
  InputMessageType,
  SharedXRInputSource,
  UpdateXRInputSourcesMessage,
} from "./input.common";
import { InputController, createInputController, InputControllerComponent } from "./InputController";

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
