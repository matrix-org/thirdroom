import { IMainThreadContext } from "../../engine/MainThread";
import { defineModule, registerMessageHandler } from "../../engine/module/module.common";
import { createDisposables } from "../../engine/utils/createDisposables";
import { CameraRigMessage } from "./CameraRig.common";

export const CameraRigModule = defineModule<IMainThreadContext, {}>({
  name: "camera-rig-module",
  create() {
    return {};
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, CameraRigMessage.ExitPointerLock, () => {
        document.exitPointerLock();
      }),
      registerMessageHandler(ctx, CameraRigMessage.RequestPointerLock, () => {
        ctx.canvas?.requestPointerLock();
      }),
    ]);
  },
});
