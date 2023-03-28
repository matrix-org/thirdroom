import { Room, CallIntent, LocalMedia, Content, GroupCall, Session } from "@thirdroom/hydrogen-view-sdk";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { AudioModule, setLocalMediaStream } from "../../engine/audio/audio.main";
import { disposeActiveMatrixRoom, setActiveMatrixRoom } from "../../engine/matrix/matrix.main";
import { getModule, Thread } from "../../engine/module/module.common";
import {
  createMatrixNetworkInterface,
  matrixNetworkInterfaceAtom,
} from "../../engine/network/createMatrixNetworkInterface";
import { connectToTestNet, reconnectPeers } from "../../engine/network/network.main";
import { SetObjectCapMessage, SetObjectCapMessageType } from "../../plugins/spawnables/spawnables.common";
import { enterWorld, exitWorld, loadWorld } from "../../plugins/thirdroom/thirdroom.main";
import { worldAtom } from "../state/world";
import { getRoomCall, roomIdToAlias, updateWorldProfile } from "../utils/matrixUtils";
import { useHydrogen } from "./useHydrogen";
import { useMainThreadContext } from "./useMainThread";

export interface WorldLoader {
  loadWorld: (world: Room, content: Content) => Promise<void>;
  reloadWorld: (world: Room, content: Content) => Promise<void>;
  enterWorld: (
    world: Room,
    options?: {
      reload?: boolean;
    }
  ) => Promise<(() => void) | undefined>;
  exitWorld: () => void;
}

let worldReloadId = 0;

export function useWorldLoader(): WorldLoader {
  const navigate = useNavigate();
  const { session, platform, client } = useHydrogen(true);
  const mainThread = useMainThreadContext();
  const [matrixNetworkInterface, setMatrixNetworkInterface] = useAtom(matrixNetworkInterfaceAtom);
  const [{ worldId, entered }, setWorld] = useAtom(worldAtom);

  const exitWorldCallback = useCallback(async () => {
    if (!entered || !worldId) {
      console.warn("cannot exit world when world is not entered");
      return;
    }

    matrixNetworkInterface?.dispose();

    disposeActiveMatrixRoom(mainThread);

    setWorld({ type: "CLOSE" });
    navigate("/");
  }, [setWorld, navigate, matrixNetworkInterface, mainThread, entered, worldId]);

  const loadWorldCallback = useCallback(
    async (world: Room, content: Content) => {
      if (entered) {
        await exitWorldCallback();
      }

      const roomId = world.id;

      setWorld({ type: "LOAD", roomId });

      const maxObjectCap = content.max_member_object_cap;
      let sceneUrl = content.scene_url;
      let scriptUrl = content.script_url;

      if (typeof sceneUrl !== "string") {
        throw new Error("3D scene does not exist for this world.");
      }

      if (sceneUrl.startsWith("mxc:")) {
        sceneUrl = session.mediaRepository.mxcUrl(sceneUrl)!;
      }

      if (scriptUrl && scriptUrl.startsWith("mxc:")) {
        scriptUrl = session.mediaRepository.mxcUrl(scriptUrl)!;
      }

      try {
        await loadWorld(mainThread, sceneUrl, scriptUrl);
        await setActiveMatrixRoom(mainThread, session, roomId);

        // set max obj cap
        if (maxObjectCap !== undefined) {
          mainThread.sendMessage<SetObjectCapMessage>(Thread.Game, {
            type: SetObjectCapMessageType,
            value: maxObjectCap,
          });
        }
      } catch (err: any) {
        throw new Error(err?.message ?? "Unknown error loading world.");
      }
    },
    [mainThread, session, setWorld, entered, exitWorldCallback]
  );

  const getWorldGroupCall = (session: Session, world: Room) => getRoomCall(session.callHandler.calls, world.id);

  const connectGroupCall = useCallback(
    async (world: Room, groupCall: GroupCall) => {
      if (!groupCall) {
        groupCall = await session.callHandler.createCall(world.id, "m.voice", "World Call", CallIntent.Room);
      }

      let stream;
      try {
        stream = await platform.mediaDevices.getMediaTracks(true, false);
      } catch (err) {
        console.error(err);
      }
      const localMedia = stream
        ? new LocalMedia().withUserMedia(stream).withDataChannel({})
        : new LocalMedia().withDataChannel({});

      await groupCall.join(localMedia);

      return groupCall;
    },
    [session, platform]
  );

  const enterWorldCallback = useCallback(
    async (
      world: Room,
      options?: {
        reload?: boolean;
      }
    ): Promise<(() => void) | undefined> => {
      try {
        if (import.meta.env.VITE_USE_TESTNET) {
          connectToTestNet(mainThread);
          return undefined;
        }

        const groupCall = getWorldGroupCall(session, world);
        if (!groupCall) return;

        await connectGroupCall(world, groupCall);
        await updateWorldProfile(session, world);

        setLocalMediaStream(mainThread, groupCall.localMedia?.userMedia);

        const powerLevels = await world.observePowerLevels();
        const matrixNetworkInterface = await createMatrixNetworkInterface(
          mainThread,
          client,
          powerLevels.get(),
          groupCall
        );
        setMatrixNetworkInterface(matrixNetworkInterface);

        await enterWorld(mainThread);

        const audio = getModule(mainThread, AudioModule);
        audio.context.resume().catch(() => console.error("Couldn't resume audio context"));

        const { muteSettings } = groupCall;
        // Mute after connecting based on user preference
        if (muteSettings?.microphone === false && localStorage.getItem("microphone") !== "true") {
          groupCall.setMuted(muteSettings.toggleMicrophone());
        }

        setWorld({ type: "ENTER" });

        const { reload } = options ?? {};

        const worldAlias = roomIdToAlias(session.rooms, world.id);
        const reloadPath = reload ? `?reload=${++worldReloadId}` : "";

        navigate(`/world/${worldAlias ?? world.id}${reloadPath}`);
      } catch (err) {
        throw err;
      }
    },
    [session, mainThread, connectGroupCall, navigate, client, setMatrixNetworkInterface, setWorld]
  );

  const reloadWorldCallback = useCallback(
    async (world: Room, content: Content) => {
      disposeActiveMatrixRoom(mainThread);

      exitWorld(mainThread);

      await loadWorldCallback(world, content);

      await enterWorld(mainThread);

      setWorld({ type: "ENTER" });
      const worldAlias = roomIdToAlias(session.rooms, world.id);
      navigate(`/world/${worldAlias ?? world.id}`);

      reconnectPeers(mainThread);
    },
    [loadWorldCallback, setWorld, mainThread, navigate, session.rooms]
  );

  return {
    loadWorld: loadWorldCallback,
    enterWorld: enterWorldCallback,
    exitWorld: exitWorldCallback,
    reloadWorld: reloadWorldCallback,
  };
}
