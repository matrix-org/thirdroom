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
  xrInputSources: Map<number, SharedXRInputSource>;
  xrInputSourcesByHand: Map<XRHandedness, SharedXRInputSource>;
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
      xrInputSources: new Map(),
      xrPrimaryHand: "right",
      xrInputSourcesByHand: new Map(),
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, InputMessageType.UpdateXRInputSources, onUpdateXRInputSources),
    ]);
  },
});

function onUpdateXRInputSources(ctx: GameState, { added, removed }: UpdateXRInputSourcesMessage) {
  const { xrInputSources, xrInputSourcesByHand } = getModule(ctx, InputModule);

  for (const id of removed) {
    const inputSource = xrInputSources.get(id);

    if (inputSource) {
      xrInputSourcesByHand.delete(inputSource.handedness);
      xrInputSources.delete(id);
    }
  }

  for (const item of added) {
    xrInputSources.set(item.id, item);
    xrInputSourcesByHand.set(item.handedness, item);
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
