import { MainContext } from "../MainThread";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { CameraRigMessage } from "./Player.common";

export const PlayerModule = defineModule<MainContext, { orbiting: boolean }>({
  name: "player",
  create() {
    return { orbiting: false };
  },
  init(ctx) {
    const module = getModule(ctx, PlayerModule);

    return createDisposables([
      registerMessageHandler(ctx, CameraRigMessage.StartOrbit, () => {
        module.orbiting = true;
        document.exitPointerLock();
      }),
      registerMessageHandler(ctx, CameraRigMessage.StopOrbit, () => {
        module.orbiting = false;
        ctx.canvas?.requestPointerLock();
      }),
    ]);
  },
});
