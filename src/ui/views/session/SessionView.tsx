import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
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
import { useStore } from "../../hooks/useStore";
import { useWorld } from "../../hooks/useRoomIdFromAlias";
import { createMatrixNetworkInterface } from "../../../engine/network/createMatrixNetworkInterface";
import { connectToTestNet } from "../../../engine/network/network.main";
import { loadWorld } from "../../../plugins/thirdroom/thirdroom.main";
import { getProfileRoom } from "../../utils/matrixUtils";
import { useRoomStatus } from "../../hooks/useRoomStatus";

let worldReloadId = 0;

export interface SessionOutletContext {
  world?: Room | RoomBeingCreated;
  activeCall?: GroupCall;
  canvasRef: RefObject<HTMLCanvasElement>;
  onExitWorld: () => void;
}

export function SessionView() {
  const { client, session, platform } = useHydrogen(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);
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
      .observeStateTypeAndKey("m.world", "")
      .then((observable) => {
        const onLoad = async (event: StateEvent | undefined) => {
          let sceneUrl = event?.content?.scene_url;

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
            await loadWorld(mainThread!, sceneUrl);
            state.world.loadedWorld();
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

    const stream = await platform.mediaDevices.getMediaTracks(true, false);
    const localMedia = new LocalMedia().withUserMedia(stream).withDataChannel({});
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

  const outletContext = useMemo<SessionOutletContext>(
    () => ({
      world,
      activeCall,
      canvasRef,
      onExitWorld,
    }),
    [world, activeCall, canvasRef, onExitWorld]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="SessionView">
        <canvas className="SessionView__viewport" ref={canvasRef} />
        {mainThread ? (
          <MainThreadContextProvider value={mainThread}>
            <Outlet context={outletContext} />
            {isOverlayOpen && (
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
