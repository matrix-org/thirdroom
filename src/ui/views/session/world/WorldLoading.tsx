import { useCallback, useEffect, useState } from "react";
import { CallIntent, LocalMedia, Room, StateEvent, SubscriptionHandle } from "@thirdroom/hydrogen-view-sdk";

import { useStore } from "../../../hooks/useStore";
import { IMainThreadContext } from "../../../../engine/MainThread";
import { getModule, registerMessageHandler, Thread } from "../../../../engine/module/module.common";
import { FetchProgressMessage, FetchProgressMessageType } from "../../../../engine/utils/fetchWithProgress.game";
import { Progress } from "../../../atoms/progress/Progress";
import { Text } from "../../../atoms/text/Text";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { bytesToSize, getPercentage } from "../../../utils/common";
import "./WorldLoading.css";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { loadWorld } from "../../../../plugins/thirdroom/thirdroom.main";
import { SetObjectCapMessage, SetObjectCapMessageType } from "../../../../plugins/spawnables/spawnables.common";
import { useWorldAction } from "../../../hooks/useWorldAction";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { createMatrixNetworkInterface } from "../../../../engine/network/createMatrixNetworkInterface";
import { getRoomCall, updateWorldProfile } from "../../../utils/matrixUtils";
import { connectToTestNet } from "../../../../engine/network/network.main";
import { AudioModule } from "../../../../engine/audio/audio.main";

function useWorldLoadingProgress(worldId?: string) {
  const engine = useMainThreadContext();
  const [loadProgress, setLoadProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });

  useEffect(() => {
    const onFetchProgress = (ctx: IMainThreadContext, message: FetchProgressMessage) => {
      setLoadProgress(message.status);
    };
    return registerMessageHandler(engine, FetchProgressMessageType, onFetchProgress);
  }, [engine]);

  useEffect(() => {
    setLoadProgress({ loaded: 0, total: 0 });
  }, [worldId]);

  return loadProgress;
}

function useLoadWorld(onLoad: (roomId: string) => void, roomId?: string, reloadId?: string) {
  const { session } = useHydrogen(true);
  const mainThread = useMainThreadContext();
  const { exitWorld } = useWorldAction(session);
  const [error, setError] = useState<string>();
  const isMounted = useIsMounted();

  const handleLoad = useCallback(
    async (event: StateEvent | undefined) => {
      if (!roomId) return;
      let sceneUrl = event?.content?.scene_url;
      const maxObjectCap = event?.content?.max_member_object_cap;

      if (typeof sceneUrl !== "string") {
        setError("3D scene does not exist for this world.");
        return;
      }

      if (sceneUrl.startsWith("mxc:")) {
        sceneUrl = session.mediaRepository.mxcUrl(sceneUrl);
      }

      try {
        await loadWorld(mainThread, sceneUrl);
        onLoad(roomId);

        // set max obj cap
        if (maxObjectCap !== undefined)
          mainThread.sendMessage<SetObjectCapMessage>(Thread.Game, {
            type: SetObjectCapMessageType,
            value: maxObjectCap,
          });
      } catch (err: any) {
        setError(err?.message ?? "Unknown error loading world.");
        return;
      }
    },
    [mainThread, session.mediaRepository, roomId, onLoad]
  );

  useEffect(() => {
    setError(undefined);
    const world = roomId ? session.rooms.get(roomId) : undefined;
    let subscriptionHandle: SubscriptionHandle | undefined;

    world?.observeStateTypeAndKey("org.matrix.msc3815.world", "").then((observable) => {
      if (!isMounted()) return;
      subscriptionHandle = observable.subscribe(handleLoad);
      const initialEvent = observable.get();
      handleLoad(initialEvent);
    });

    return () => {
      subscriptionHandle?.();
      exitWorld();
      setError(undefined);
    };
  }, [roomId, reloadId, session, mainThread, exitWorld, handleLoad, isMounted]);

  return error;
}

function useEnterWorld() {
  const { worldId, entered, setNetworkInterfaceDisposer } = useStore((state) => state.world);
  const mainThread = useMainThreadContext();
  const { session, platform, client } = useHydrogen(true);

  const connectGroupCall = useCallback(
    async (world: Room) => {
      let groupCall = getRoomCall(session.callHandler.calls, world.id);

      if (!groupCall) {
        groupCall = await session.callHandler.createCall(world.id, "m.voice", "World Call", CallIntent.Room);
      }

      let stream;
      try {
        // TODO: Re-enable when we fix issues with joining without microphone enabled
        // if (localStorage.getItem("microphone") === "true") {
        stream = await platform.mediaDevices.getMediaTracks(true, false);
        // }
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
    async (world: Room) => {
      if (!world || "isBeingCreated" in world || !mainThread) {
        return;
      }

      const groupCall = await connectGroupCall(world);
      await updateWorldProfile(session, world);

      if (import.meta.env.VITE_USE_TESTNET) {
        connectToTestNet(mainThread);
        return;
      }

      const powerLevels = await world.observePowerLevels();
      const disposer = createMatrixNetworkInterface(mainThread, client, powerLevels.get(), groupCall);
      setNetworkInterfaceDisposer(disposer);

      const audio = getModule(mainThread, AudioModule);
      audio.context.resume();
    },
    [session, mainThread, client, setNetworkInterfaceDisposer, connectGroupCall]
  );

  useEffect(() => {
    const world = worldId ? session.rooms.get(worldId) : undefined;
    if (world && !entered) {
      enterWorldCallback(world);
    }
  }, [worldId, entered, enterWorldCallback, session.rooms]);
}

export function WorldLoading({ roomId, reloadId }: { roomId?: string; reloadId?: string }) {
  const { worldId, setWorld, entered } = useStore((state) => state.world);
  const loadProgress = useWorldLoadingProgress(worldId);

  // TODO: show error with reload button
  useLoadWorld(setWorld, roomId, reloadId);
  useEnterWorld();

  if (entered) return <></>;

  // TODO: STYLE ME
  return (
    <div className="WorldLoading flex flex-column gap-xs">
      <Progress
        variant="secondary"
        max={100}
        value={loadProgress.total === 0 ? 0 : getPercentage(loadProgress.total, loadProgress.loaded)}
      />
      <div className="flex justify-between gap-md">
        <Text color="surface-low" variant="b3">
          {`Loading: ${getPercentage(loadProgress.total, loadProgress.loaded)}%`}
        </Text>
        <Text color="surface-low" variant="b3">{`${bytesToSize(loadProgress.loaded)} / ${bytesToSize(
          loadProgress.total
        )}`}</Text>
      </div>
    </div>
  );
}
