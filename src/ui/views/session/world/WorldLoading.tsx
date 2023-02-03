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
import { WorldPreviewCard } from "../../components/world-preview-card/WorldPreviewCard";
import { disposeActiveMatrixRoom, setActiveMatrixRoom } from "../../../../engine/matrix/matrix.main";

interface WorldLoadProgress {
  loaded: number;
  total: number;
}

function useWorldLoadingProgress(): [() => void, WorldLoadProgress] {
  const engine = useMainThreadContext();
  const [loadProgress, setLoadProgress] = useState<WorldLoadProgress>({ loaded: 0, total: 0 });

  useEffect(() => {
    const onFetchProgress = (ctx: IMainThreadContext, message: FetchProgressMessage) => {
      setLoadProgress(message.status);
    };
    return registerMessageHandler(engine, FetchProgressMessageType, onFetchProgress);
  }, [engine]);

  const reset = useCallback(() => {
    setLoadProgress({ loaded: 0, total: 0 });
  }, []);

  return [reset, loadProgress];
}

function useLoadWorld() {
  const { session } = useHydrogen(true);
  const mainThread = useMainThreadContext();

  const loadWorldCallback = useCallback(
    async (roomId: string, event: StateEvent | undefined) => {
      if (!roomId) return;
      let sceneUrl = event?.content?.scene_url;
      let scriptUrl = event?.content?.script_url;
      const maxObjectCap = event?.content?.max_member_object_cap;

      if (typeof sceneUrl !== "string") {
        throw new Error("3D scene does not exist for this world.");
      }

      if (sceneUrl.startsWith("mxc:")) {
        sceneUrl = session.mediaRepository.mxcUrl(sceneUrl);
      }

      if (scriptUrl && scriptUrl.startsWith("mxc:")) {
        scriptUrl = session.mediaRepository.mxcUrl(scriptUrl);
      }

      try {
        await loadWorld(mainThread, sceneUrl, scriptUrl);
        await setActiveMatrixRoom(mainThread, session, roomId);

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
    [mainThread, session]
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
      const disposer = await createMatrixNetworkInterface(mainThread, client, powerLevels.get(), groupCall);

      const audio = getModule(mainThread, AudioModule);
      audio.context.resume().catch(() => console.error("Couldn't resume audio context"));

      const { muteSettings } = groupCall;
      // Mute after connecting based on user preference
      if (muteSettings?.microphone === false && localStorage.getItem("microphone") !== "true") {
        groupCall.setMuted(muteSettings.toggleMicrophone());
      }

      return disposer;
    },
    [session, mainThread, client, connectGroupCall]
  );

  return enterWorldCallback;
}

export function WorldLoading({ roomId, reloadId }: { roomId?: string; reloadId?: string }) {
  const { worldId, setWorld, entered, setNetworkInterfaceDisposer } = useStore((state) => state.world);
  const { closeOverlay, openOverlay, isOpen: isOverlayOpen } = useStore((state) => state.overlay);
  const selectWorld = useStore((state) => state.overlayWorld.selectWorld);
  const { session } = useHydrogen(true);
  const { enterWorld: enterWorldAction } = useWorldAction(session);
  const [resetLoadProgress, loadProgress] = useWorldLoadingProgress();
  const isMounted = useIsMounted();
  const prevRoomId = usePreviousState(roomId);
  const [error, setError] = useState<Error>();
  const world = roomId ? session.rooms.get(roomId) : undefined;
  const [creator, setCreator] = useState<string>();
  const mainThread = useMainThreadContext();

  useEffect(() => {
    if (roomId && prevRoomId !== roomId) {
      closeOverlay();
    }

    if (!roomId && prevRoomId) {
      openOverlay();
    }
  }, [roomId, prevRoomId, openOverlay, closeOverlay]);

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
        resetLoadProgress();
        loadWorld(world.id, event)
          .then(() => {
            setWorld("");
            setWorld(world.id);
          })
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
      const world = useStore.getState().world;
      world.disposeNetworkInterface?.();
      world.closeWorld();
      disposeActiveMatrixRoom(mainThread);
    };
  }, [session, roomId, reloadId, loadWorld, isMounted, setWorld, resetLoadProgress, mainThread]);

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

  useEffect(() => {
    let disposed = false;
    world?.getStateEvent("m.room.create", "").then((stateEvent) => {
      if (disposed) return;
      const creatorId = stateEvent?.event.sender;
      if (!creatorId) return;
      setCreator(creatorId);
    });
    return () => {
      disposed = true;
    };
  }, [world]);

  if (isOverlayOpen) return null;

  if (roomId && error) {
    return (
      <div className="WorldLoading flex justify-center">
        <WorldPreviewCard
          title={world?.name ?? world?.canonicalAlias ?? "Unknown World"}
          desc={error?.message}
          options={<Button onClick={() => enterWorldAction(roomId, { reload: true })}>Reload</Button>}
        />
      </div>
    );
  }

  if (!roomId || entered) return <></>;

  return (
    <div className="WorldLoading flex justify-center">
      <WorldPreviewCard
        title={world?.name ?? world?.canonicalAlias ?? "Unknown World"}
        desc={creator ? `Created by ${creator}` : undefined}
        content={
          <div className="flex flex-column gap-xs">
            <Progress variant="secondary" max={100} value={getPercentage(loadProgress.total, loadProgress.loaded)} />
            <div className="flex justify-between gap-md">
              <Text variant="b3">{`Loading Scene: ${getPercentage(loadProgress.total, loadProgress.loaded)}%`}</Text>
              <Text variant="b3">{`${bytesToSize(loadProgress.loaded)} / ${bytesToSize(loadProgress.total)}`}</Text>
            </div>
          </div>
        }
      />
    </div>
  );
}
