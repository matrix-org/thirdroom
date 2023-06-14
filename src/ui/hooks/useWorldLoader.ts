import { Room, Content } from "@thirdroom/hydrogen-view-sdk";
import { useSetAtom } from "jotai";
import { useCallback } from "react";

import { AudioModule } from "../../engine/audio/audio.main";
import { disposeActiveMatrixRoom, setActiveMatrixRoom } from "../../engine/matrix/matrix.main";
import { getModule } from "../../engine/module/module.common";
import {
  createMatrixNetworkInterface,
  registerMatrixNetworkInterface,
  provideMatrixNetworkInterface,
} from "../../engine/network/createMatrixNetworkInterface";
import { enterWorld, loadWorld, reloadWorld } from "../../plugins/thirdroom/thirdroom.main";
import { worldAtom } from "../state/world";
import { useHydrogen } from "./useHydrogen";
import { useMainThreadContext } from "./useMainThread";

export interface WorldLoader {
  loadAndEnterWorld: (
    world: Room,
    content: Content,
    options?: {
      reload?: boolean;
    }
  ) => Promise<void>;
  reloadWorld: (world: Room, content: Content) => Promise<void>;
  exitWorld: () => void;
}

export function useWorldLoader(): WorldLoader {
  const { session, platform, client } = useHydrogen(true);
  const mainThread = useMainThreadContext();
  const setWorld = useSetAtom(worldAtom);

  const exitWorldCallback = useCallback(async () => {
    provideMatrixNetworkInterface((matrixNetworkInterface) => {
      matrixNetworkInterface?.dispose();
    });

    disposeActiveMatrixRoom(mainThread);

    setWorld({ type: "CLOSE" });
  }, [setWorld, mainThread]);

  const loadAndEnterWorldCallback = useCallback(
    async (world: Room, content: Content) => {
      const roomId = world.id;

      setWorld({ type: "LOAD", roomId });

      const maxObjectCap = content.max_member_object_cap;
      let environmentUrl = content.scene_url;
      let environmentScriptUrl = content.script_url;

      if (typeof environmentUrl !== "string") {
        throw new Error("3D scene does not exist for this world.");
      }

      if (environmentUrl.startsWith("mxc:")) {
        environmentUrl = session.mediaRepository.mxcUrl(environmentUrl)!;
      }

      if (environmentScriptUrl && environmentScriptUrl.startsWith("mxc:")) {
        environmentScriptUrl = session.mediaRepository.mxcUrl(environmentScriptUrl)!;
      }

      try {
        setActiveMatrixRoom(mainThread, session, world.id);

        const [matrixNetworkInterface] = await Promise.all([
          createMatrixNetworkInterface(mainThread, client, platform, world),
          loadWorld(mainThread, environmentUrl, {
            environmentScriptUrl,
            maxObjectCap,
          }),
        ]);

        registerMatrixNetworkInterface(matrixNetworkInterface);

        await enterWorld(mainThread, session.userId);

        const audio = getModule(mainThread, AudioModule);
        audio.context.resume().catch(() => console.error("Couldn't resume audio context"));

        setWorld({ type: "ENTER" });
      } catch (err: any) {
        throw new Error(err?.message ?? "Unknown error loading world.");
      }
    },
    [mainThread, session, setWorld, client, platform]
  );

  // keeps the call established and reloads the scene/script
  const reloadWorldCallback = useCallback(
    async (world: Room, content: Content) => {
      setWorld({ type: "LOAD", roomId: world.id });

      disposeActiveMatrixRoom(mainThread);
      setActiveMatrixRoom(mainThread, session, world.id);

      const maxObjectCap = content.max_member_object_cap;
      let environmentUrl = content.scene_url;
      let environmentScriptUrl = content.script_url;

      if (typeof environmentUrl !== "string") {
        throw new Error("3D scene does not exist for this world.");
      }

      if (environmentUrl.startsWith("mxc:")) {
        environmentUrl = session.mediaRepository.mxcUrl(environmentUrl)!;
      }

      if (environmentScriptUrl && environmentScriptUrl.startsWith("mxc:")) {
        environmentScriptUrl = session.mediaRepository.mxcUrl(environmentScriptUrl)!;
      }

      await reloadWorld(mainThread, environmentUrl, {
        environmentScriptUrl,
        maxObjectCap,
      });

      setWorld({ type: "ENTER" });
    },
    [setWorld, mainThread, session]
  );

  return {
    loadAndEnterWorld: loadAndEnterWorldCallback,
    exitWorld: exitWorldCallback,
    reloadWorld: reloadWorldCallback,
  };
}
