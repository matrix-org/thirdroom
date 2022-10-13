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
import { useIsMounted } from "../../../hooks/useIsMounted";
import { createMatrixNetworkInterface } from "../../../../engine/network/createMatrixNetworkInterface";
import { getRoomCall, updateWorldProfile } from "../../../utils/matrixUtils";
import { connectToTestNet } from "../../../../engine/network/network.main";
import { AudioModule } from "../../../../engine/audio/audio.main";
import { usePreviousState } from "../../../hooks/usePreviousState";
import { Button } from "../../../atoms/button/Button";
import { useWorldAction } from "../../../hooks/useWorldAction";

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

function useLoadWorld() {
  const { session } = useHydrogen(true);
  const mainThread = useMainThreadContext();

  const loadWorldCallback = useCallback(
    async (roomId: string, event: StateEvent | undefined) => {
      if (!roomId) return;
      let sceneUrl = event?.content?.scene_url;
      const maxObjectCap = event?.content?.max_member_object_cap;

      if (typeof sceneUrl !== "string") {
        throw new Error("3D scene does not exist for this world.");
      }

      if (sceneUrl.startsWith("mxc:")) {
        sceneUrl = session.mediaRepository.mxcUrl(sceneUrl);
      }

      try {
        await loadWorld(mainThread, sceneUrl);

        // set max obj cap
        if (maxObjectCap !== undefined)
          mainThread.sendMessage<SetObjectCapMessage>(Thread.Game, {
            type: SetObjectCapMessageType,
            value: maxObjectCap,
          });
      } catch (err: any) {
        throw new Error(err?.message ?? "Unknown error loading world.");
      }
    },
    [mainThread, session.mediaRepository]
  );

  return loadWorldCallback;
}

function useEnterWorld() {
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
    async (world: Room): Promise<(() => void) | undefined> => {
      if ("isBeingCreated" in world) {
        return undefined;
      }

      const groupCall = await connectGroupCall(world);
      await updateWorldProfile(session, world);

      if (import.meta.env.VITE_USE_TESTNET) {
        connectToTestNet(mainThread);
        return undefined;
      }

      const powerLevels = await world.observePowerLevels();
      const disposer = createMatrixNetworkInterface(mainThread, client, powerLevels.get(), groupCall);

      const audio = getModule(mainThread, AudioModule);
      audio.context.resume();
      return disposer;
    },
    [session, mainThread, client, connectGroupCall]
  );

  return enterWorldCallback;
}

export function WorldLoading({ roomId, reloadId }: { roomId?: string; reloadId?: string }) {
  const mainThread = useMainThreadContext();
  const { worldId, setWorld, closeWorld, entered, setNetworkInterfaceDisposer } = useStore((state) => state.world);
  const { closeOverlay, openOverlay, isOpen: isOverlayOpen } = useStore((state) => state.overlay);
  const selectWorld = useStore((state) => state.overlayWorld.selectWorld);
  const { session } = useHydrogen(true);
  const { enterWorld: enterWorldAction } = useWorldAction(session);
  const loadProgress = useWorldLoadingProgress(worldId);
  const isMounted = useIsMounted();
  const prevRoomId = usePreviousState(roomId);
  const [error, setError] = useState<Error>();

  if (roomId && prevRoomId !== roomId) {
    closeOverlay();
  }
  if (entered) {
    mainThread.canvas.requestPointerLock();
  }

  if (!roomId && prevRoomId) {
    openOverlay();
    document.exitPointerLock();
  }

  const loadWorld = useLoadWorld();
  const enterWorld = useEnterWorld();

  useEffect(() => {
    if (!isOverlayOpen && roomId && session.rooms.get(roomId)) {
      selectWorld(roomId);
    }
  }, [isOverlayOpen, selectWorld, roomId, session.rooms]);

  useEffect(() => {
    setError(undefined);
    const world = roomId ? session.rooms.get(roomId) : undefined;
    let subscriptionHandle: SubscriptionHandle | undefined;

    world?.observeStateTypeAndKey("org.matrix.msc3815.world", "").then((observable) => {
      if (!isMounted()) return;

      const handleLoad = (event: StateEvent | undefined) => {
        loadWorld(world.id, event)
          .then(() => setWorld(world.id))
          .catch((err: Error) => {
            setError(err);
          });
      };

      subscriptionHandle = observable.subscribe(handleLoad);
      const initialEvent = observable.get();
      handleLoad(initialEvent);
    });

    return () => {
      subscriptionHandle?.();
      closeWorld();
    };
  }, [session, roomId, reloadId, closeWorld, loadWorld, isMounted, setWorld]);

  useEffect(() => {
    const world = worldId ? session.rooms.get(worldId) : undefined;
    if (world && !entered) {
      enterWorld(world)
        .then((networkInterfaceDisposer) => {
          if (networkInterfaceDisposer) {
            setNetworkInterfaceDisposer(networkInterfaceDisposer);
          }
        })
        .catch((err: Error) => {
          setError(err);
        });
    }
  }, [worldId, entered, enterWorld, setNetworkInterfaceDisposer, session.rooms]);

  if (isOverlayOpen) return null;

  if (roomId && error) {
    return (
      <div className="WorldLoading flex items-center gap-md">
        <Text className="grow" color="world">
          {error.message}
        </Text>
        <Button onClick={() => enterWorldAction(roomId, { reload: true })}>Reload</Button>
      </div>
    );
  }
  if (!roomId || entered || loadProgress.total === 0) return <></>;

  return (
    <div className="WorldLoading flex flex-column gap-xs">
      <Progress variant="secondary" max={100} value={getPercentage(loadProgress.total, loadProgress.loaded)} />
      <div className="flex justify-between gap-md">
        <Text color="world" variant="b3">
          {`Loading: ${getPercentage(loadProgress.total, loadProgress.loaded)}%`}
        </Text>
        <Text color="world" variant="b3">{`${bytesToSize(loadProgress.loaded)} / ${bytesToSize(
          loadProgress.total
        )}`}</Text>
      </div>
    </div>
  );
}
