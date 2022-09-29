import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import {
  GroupCall,
  Room,
  LocalMedia,
  CallIntent,
  RoomBeingCreated,
  RoomStatus,
  SubscriptionHandle,
  StateEvent,
} from "@thirdroom/hydrogen-view-sdk";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import "./SessionView.css";
import { useInitMainThreadContext, MainThreadContextProvider } from "../../hooks/useMainThread";
import { Overlay } from "./overlay/Overlay";
import { StatusBar } from "./statusbar/StatusBar";
import { useHydrogen } from "../../hooks/useHydrogen";
import { useCalls } from "../../hooks/useCalls";
import { useStore, WorldLoadState } from "../../hooks/useStore";
import { useWorld } from "../../hooks/useRoomIdFromAlias";
import { createMatrixNetworkInterface } from "../../../engine/network/createMatrixNetworkInterface";
import { connectToTestNet } from "../../../engine/network/network.main";
import { loadWorld } from "../../../plugins/thirdroom/thirdroom.main";
import { getProfileRoom, parseMatrixUri } from "../../utils/matrixUtils";
import { useRoomStatus } from "../../hooks/useRoomStatus";
import { AlertDialog } from "./dialogs/AlertDialog";
import { Button } from "../../atoms/button/Button";
import { AudioModule } from "../../../engine/audio/audio.main";
import { getModule, Thread } from "../../../engine/module/module.common";
import { SetObjectCapMessage, SetObjectCapMessageType } from "../../../plugins/spawnables/spawnables.common";
import { useSettingsStore } from "../../hooks/useSettingsStore";

let worldReloadId = 0;

export interface SessionOutletContext {
  world?: Room | RoomBeingCreated;
  activeCall?: GroupCall;
  canvasRef: RefObject<HTMLCanvasElement>;
  onExitWorld: () => void;
  onWorldTransfer: (uri: string) => void;
  onJoinSelectedWorld: () => void;
  onLoadSelectedWorld: () => void;
  onEnterSelectedWorld: () => void;
}

export default function SessionView() {
  const { client, session, platform } = useHydrogen(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const quality = useSettingsStore((state) => state.settings.quality);
  const mainThread = useInitMainThreadContext(canvasRef, quality);
  const isOverlayOpen = useStore((state) => state.overlay.isOpen);
  const isEnteredWorld = useStore((state) => state.world.isEnteredWorld);

  const navigate = useNavigate();

  const homeMatch = useMatch({ path: "/", end: true });
  const isHome = homeMatch !== null;

  const networkInterfaceRef = useRef<() => void>();

  const [worldIdOrAlias, world, curWorldReloadId] = useWorld();

  const calls = useCalls(session);
  const activeCall = useMemo(() => {
    const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.roomId === world?.id ? call : []));
    return roomCalls.length ? roomCalls[0] : undefined;
  }, [calls, world]);

  const { value: roomStatus } = useRoomStatus(session, world?.id);

  const [showPortalPrompt, setShowPortalPrompt] = useState<boolean>(false);

  useEffect(() => {
    if (
      world &&
      "isBeingCreated" in world &&
      roomStatus !== undefined &&
      (roomStatus & RoomStatus.Replaced) !== 0 &&
      roomStatus & RoomStatus.BeingCreated
    ) {
      navigate(`/world/${world.roomId}`);
    }
  }, [navigate, roomStatus, world]);

  useEffect(() => {
    const state = useStore.getState();

    if (!world && worldIdOrAlias) {
      state.world.setInitialWorld(worldIdOrAlias);
      return;
    }

    if (!world || !mainThread) {
      return;
    }

    if ("isBeingCreated" in world) {
      state.world.loadingWorld(world.id);

      return () => {
        state.world.leftWorld();
      };
    }

    let subscriptionHandle: SubscriptionHandle;

    state.world.loadingWorld(world.id);

    world
      .observeStateTypeAndKey("org.matrix.msc3815.world", "")
      .then((observable) => {
        const onLoad = async (event: StateEvent | undefined) => {
          let sceneUrl = event?.content?.scene_url;
          const maxObjectCap = event?.content?.max_member_object_cap;

          if (typeof sceneUrl !== "string") {
            state.world.setWorldError(new Error("Matrix room is not a valid world."));
            return;
          }

          if (sceneUrl.startsWith("mxc:")) {
            try {
              sceneUrl = session.mediaRepository.mxcUrl(sceneUrl);
            } catch (error) {
              console.error(error);
              state.world.setWorldError(new Error(`Invalid scene url "${sceneUrl}"`));
              return;
            }
          }

          try {
            await loadWorld(mainThread, sceneUrl);
            state.world.loadedWorld();

            // set max obj cap
            if (maxObjectCap !== undefined)
              mainThread.sendMessage<SetObjectCapMessage>(Thread.Game, {
                type: SetObjectCapMessageType,
                value: maxObjectCap,
              });
          } catch (error) {
            console.error(error);
            state.world.setWorldError(error as Error);
            return;
          }
        };

        subscriptionHandle = observable.subscribe(onLoad);

        const initialEvent = observable.get();

        if (initialEvent) {
          onLoad(initialEvent);
        } else {
          world
            .getStateEvent("m.world")
            .then((result) => {
              if (result) {
                const error = new Error("World needs to be manually updated by owner.");
                console.error(error);
                state.world.setWorldError(error as Error);
              }
            })
            .catch(console.error);
        }
      })
      .catch((error) => {
        console.error(error);
        state.world.setWorldError(error as Error);
      });

    return () => {
      if (subscriptionHandle) {
        subscriptionHandle();
      }

      state.world.leftWorld();

      document.exitPointerLock();

      if (networkInterfaceRef.current) {
        networkInterfaceRef.current();
      }
    };
  }, [mainThread, world, curWorldReloadId, session, worldIdOrAlias]);

  const onJoinSelectedWorld = useCallback(async () => {
    const worldId = useStore.getState().overlayWorld.selectedWorldId;

    if (!worldId) {
      return;
    }

    useStore.getState().world.joinWorld();

    try {
      await session.joinRoom(worldId);

      const room = session.rooms.get(worldId);

      navigate(`/world/${(room && room.canonicalAlias) || worldId}`);
    } catch (error) {
      useStore.getState().world.setWorldError(error as Error);
    }
  }, [session, navigate]);

  const onReloadSelectedWorld = useCallback(() => {
    const state = useStore.getState();

    const worldId = state.overlayWorld.selectedWorldId;

    if (!worldId) {
      return;
    }

    const room = session.rooms.get(worldId);

    navigate(`/world/${(room && room.canonicalAlias) || worldId}?reload=${worldReloadId++}`);
  }, [session, navigate]);

  const onLoadSelectedWorld = useCallback(async () => {
    const state = useStore.getState();

    const worldId = state.overlayWorld.selectedWorldId;

    if (!worldId) {
      return;
    }

    const room = session.rooms.get(worldId);

    navigate(`/world/${(room && room.canonicalAlias) || worldId}`);
  }, [session, navigate]);

  const onEnterSelectedWorld = useCallback(async () => {
    if (!world || "isBeingCreated" in world || !mainThread) {
      return;
    }

    const state = useStore.getState();

    state.world.enteringWorld();

    let groupCall: GroupCall | undefined;

    for (const [, call] of Array.from(session.callHandler.calls)) {
      if (call.roomId === world.id) {
        groupCall = call;
        break;
      }
    }

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

    const profileRoom = getProfileRoom(session.rooms);

    if (profileRoom) {
      const profileEvent = await profileRoom.getStateEvent("org.matrix.msc3815.world.profile", "");

      if (profileEvent && profileEvent.event.content.avatar_url) {
        await session.hsApi.sendState(world.id, "org.matrix.msc3815.world.member", session.userId, {
          avatar_url: profileEvent.event.content.avatar_url,
        });
      }
    }

    if (import.meta.env.VITE_USE_TESTNET) {
      connectToTestNet(mainThread);
      return;
    }

    const powerLevels = await world.observePowerLevels();

    networkInterfaceRef.current = createMatrixNetworkInterface(mainThread, client, powerLevels.get(), groupCall);

    useStore.getState().world.enteredWorld();

    canvasRef.current?.requestPointerLock();

    const audio = getModule(mainThread, AudioModule);
    audio.context.resume();
  }, [world, platform, session, mainThread, client]);

  const onExitWorld = useCallback(() => {
    const state = useStore.getState();

    navigate("/");

    state.world.leftWorld();

    document.exitPointerLock();

    if (networkInterfaceRef.current) {
      networkInterfaceRef.current();
      networkInterfaceRef.current = undefined;
    }
  }, [navigate]);

  const onWorldTransfer = useCallback(
    async (uri: string) => {
      const state = useStore.getState();

      const parsedUri = parseMatrixUri(uri);

      if (parsedUri instanceof URL) {
        return;
      }

      // Terminate previous world's network connection
      if (networkInterfaceRef.current) {
        networkInterfaceRef.current();
        networkInterfaceRef.current = undefined;
      }

      // select new world
      state.overlayWorld.selectWorld(parsedUri.mxid1);

      // join if not already
      const roomStatus = await session.observeRoomStatus(parsedUri.mxid1);
      if (roomStatus.get() !== RoomStatus.Joined) {
        await onJoinSelectedWorld();
      }

      // load world
      await onLoadSelectedWorld();

      // enter world when loaded
      const interval = setInterval(() => {
        if (useStore.getState().world.loadState === WorldLoadState.Loaded) {
          setShowPortalPrompt(true);
          clearInterval(interval);
        }
      }, 100);

      return () => {
        clearInterval(interval);
      };
    },
    [onLoadSelectedWorld, onJoinSelectedWorld, session]
  );

  const outletContext = useMemo<SessionOutletContext>(
    () => ({
      world,
      activeCall,
      canvasRef,
      onExitWorld,
      onWorldTransfer,
      onJoinSelectedWorld,
      onLoadSelectedWorld,
      onEnterSelectedWorld,
    }),
    [
      world,
      activeCall,
      canvasRef,
      onExitWorld,
      onWorldTransfer,
      onJoinSelectedWorld,
      onLoadSelectedWorld,
      onEnterSelectedWorld,
    ]
  );

  const acceptPortalPrompt = useCallback(() => {
    setShowPortalPrompt(false);
    onEnterSelectedWorld();
  }, [onEnterSelectedWorld]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="SessionView">
        <AlertDialog
          open={!!showPortalPrompt}
          title="Entering New World"
          content={<div className="flex flex-column gap-xs">Are you sure you wish to enter a new world?</div>}
          buttons={
            <Button fill="outline" onClick={acceptPortalPrompt}>
              Enter World
            </Button>
          }
          requestClose={() => setShowPortalPrompt(false)}
        />
        <canvas className="SessionView__viewport" ref={canvasRef} />
        {mainThread ? (
          <MainThreadContextProvider value={mainThread}>
            <Outlet context={outletContext} />
            {isOverlayOpen && !showPortalPrompt && (
              <Overlay
                calls={calls}
                activeCall={activeCall}
                onExitWorld={onExitWorld}
                onJoinWorld={onJoinSelectedWorld}
                onReloadWorld={onReloadSelectedWorld}
                onLoadWorld={onLoadSelectedWorld}
                onEnterWorld={onEnterSelectedWorld}
              />
            )}
            <StatusBar showOverlayTip={isEnteredWorld} title={isHome ? "Home" : world?.name} />
          </MainThreadContextProvider>
        ) : (
          <div>Initializing engine...</div>
        )}
      </div>
    </DndProvider>
  );
}
