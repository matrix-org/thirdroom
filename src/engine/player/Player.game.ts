import { GameState } from "../GameTypes";
import { enableActionMap } from "../input/ActionMappingSystem";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { CharacterControllerActionMap } from "./CharacterController";
import { createDisposables } from "../utils/createDisposables";
import { ThirdRoomMessageType } from "../../plugins/thirdroom/thirdroom.common";
import { CameraRigActionMap } from "./CameraRig";

export const PlayerModule = defineModule<GameState, { orbiting: boolean }>({
  name: "player",
  create() {
    return { orbiting: false };
  },
  init(ctx) {
    enableActionMap(ctx, CameraRigActionMap);
    enableActionMap(ctx, CharacterControllerActionMap);

    const module = getModule(ctx, PlayerModule);
    return createDisposables([
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, () => {
        module.orbiting = false;
      }),
    ]);
  },
});
