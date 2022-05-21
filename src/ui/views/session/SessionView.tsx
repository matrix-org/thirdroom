import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import { GroupCall, ObservableValue, Room, LocalMedia, CallIntent } from "@thirdroom/hydrogen-view-sdk";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import "./SessionView.css";
import { useInitMainThreadContext, MainThreadContextProvider } from "../../hooks/useMainThread";
import { Overlay } from "./overlay/Overlay";
import { StatusBar } from "./statusbar/StatusBar";
import { useRoom } from "../../hooks/useRoom";
import { useHydrogen } from "../../hooks/useHydrogen";
import { useCalls } from "../../hooks/useCalls";
import { useStore } from "../../hooks/useStore";
import { useRoomIdFromAlias } from "../../hooks/useRoomIdFromAlias";
import { createMatrixNetworkInterface } from "../../../engine/network/createMatrixNetworkInterface";
import { useAsyncObservableValue } from "../../hooks/useAsyncObservableValue";
import { connectToTestNet } from "../../../engine/network/network.main";

export interface SessionOutletContext {
  world?: Room;
  activeCall?: GroupCall;
  canvasRef: RefObject<HTMLCanvasElement>;
  onLeftWorld: () => void;
}

export function SessionView() {
  const { client, session, platform } = useHydrogen(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);
  const networkInterfaceRef = useRef<() => void>();
  const isOverlayOpen = useStore((state) => state.overlay.isOpen);

  const navigate = useNavigate();

  const location = useLocation();
  const homeMatch = useMatch({ path: "/", end: true });
  const isHome = homeMatch !== null;

  const worldMatch = useMatch({ path: "world/:worldId/*" });
  const { worldId, setInitialWorld, leftWorld, enteredWorld } = useStore((state) => state.world);
  const world = useRoom(session, worldId);
  const nextWorldIdFromAlias = useRoomIdFromAlias(location.hash);

  const nextWorldId = worldMatch ? worldMatch.params["worldId"] : nextWorldIdFromAlias;

  useEffect(() => {
    setInitialWorld(nextWorldId);
  }, [nextWorldId, setInitialWorld]);

  const { value: powerLevels } = useAsyncObservableValue(
    () => (world ? world.observePowerLevels() : Promise.resolve(new ObservableValue(undefined))),
    [world]
  );
  const calls = useCalls(session);
  const activeCall = useMemo(() => {
    const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.roomId === worldId ? call : []));
    return roomCalls.length ? roomCalls[0] : undefined;
  }, [calls, worldId]);

  const onLeftWorld = useCallback(() => {
    leftWorld();
    document.exitPointerLock();

    if (activeCall) {
      activeCall.leave();
    }

    if (networkInterfaceRef.current) {
      networkInterfaceRef.current();
    }
  }, [activeCall, leftWorld]);

  const onEnteredWorld = useCallback(
    (call: GroupCall) => {
      enteredWorld();
      canvasRef.current?.requestPointerLock();

      if (import.meta.env.VITE_USE_TESTNET && mainThread) {
        connectToTestNet(mainThread);
        return;
      }

      if (mainThread && powerLevels) {
        networkInterfaceRef.current = createMatrixNetworkInterface(mainThread, client, powerLevels, call);
      }
    },
    [client, mainThread, powerLevels, enteredWorld]
  );

  const onLoadWorld = useCallback(
    async (room: Room) => {
      const isEnteredWorld = useStore.getState().world.isEnteredWorld;

      if (isEnteredWorld) {
        onLeftWorld();
      }

      navigate(`/world/${room.canonicalAlias ?? room.id}`);
      return;
    },
    [navigate, onLeftWorld]
  );

  const onEnterWorld = useCallback(
    async (room: Room) => {
      const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.roomId === room.id ? call : []));

      let call = roomCalls.length && roomCalls[0];

      if (!call) {
        call = await session.callHandler.createCall(room.id, "m.voice", "Test World", CallIntent.Room);
      }

      const stream = await platform.mediaDevices.getMediaTracks(true, false);
      const localMedia = new LocalMedia().withUserMedia(stream).withDataChannel({});
      await call.join(localMedia);

      onEnteredWorld(call);
    },
    [platform, session, calls, onEnteredWorld]
  );

  const outletContext = useMemo<SessionOutletContext>(
    () => ({
      world,
      activeCall,
      canvasRef,
      onLeftWorld,
    }),
    [world, activeCall, canvasRef, onLeftWorld]
  );

  const isEnteredWorld = useStore((state) => state.world.isEnteredWorld);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="SessionView">
        <canvas className="SessionView__viewport" ref={canvasRef} />
        {mainThread ? (
          <MainThreadContextProvider value={mainThread}>
            <Outlet context={outletContext} />
            {isOverlayOpen && <Overlay onLoadWorld={onLoadWorld} onEnterWorld={onEnterWorld} />}
            <StatusBar showOverlayTip={isEnteredWorld} title={isHome ? "Home" : world?.name} />
          </MainThreadContextProvider>
        ) : (
          <div>Initializing engine...</div>
        )}
      </div>
    </DndProvider>
  );
}
