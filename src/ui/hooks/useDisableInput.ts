import { useEffect } from "react";

import { InputModule } from "../../engine/input/input.main";
import { getModule } from "../../engine/module/module.common";
import { PlayerModule } from "../../engine/player/Player.main";
import { useMainThreadContext } from "./useMainThread";

export function useDisableInput(state = true) {
  const mainThread = useMainThreadContext();

  useEffect(() => {
    if (!state) {
      return;
    }

    const inputModule = getModule(mainThread, InputModule);
    const cameraRigModule = getModule(mainThread, PlayerModule);

    if (
      inputModule.disableInputStack.length === 0 &&
      !cameraRigModule.orbiting &&
      document.pointerLockElement === mainThread.canvas
    ) {
      document.exitPointerLock();
    }

    const stackId = inputModule.nextStackId++;

    inputModule.disableInputStack.push(stackId);

    return () => {
      const index = inputModule.disableInputStack.indexOf(stackId);

      if (index !== -1) {
        inputModule.disableInputStack.splice(index, 1);
      }

      if (inputModule.disableInputStack.length === 0 && !cameraRigModule.orbiting && mainThread.canvas.isConnected) {
        mainThread.canvas.requestPointerLock();
      }
    };
  }, [state, mainThread]);
}
