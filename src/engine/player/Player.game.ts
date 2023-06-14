import { GameContext } from "../GameTypes";
import { enableActionMap } from "../input/ActionMappingSystem";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { CharacterControllerActionMap } from "./CharacterController";
import { createDisposables } from "../utils/createDisposables";
import { ThirdRoomMessageType } from "../../plugins/thirdroom/thirdroom.common";
import { CameraRigActionMap } from "./CameraRig";
import { InputModule } from "../input/input.game";

export const PlayerModule = defineModule<GameContext, { orbiting: boolean }>({
  name: "player",
  create() {
    return { orbiting: false };
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);

    enableActionMap(input, CameraRigActionMap);
    enableActionMap(input, CharacterControllerActionMap);

    const module = getModule(ctx, PlayerModule);
    return createDisposables([
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, () => {
        module.orbiting = false;
      }),
    ]);
  },
});
