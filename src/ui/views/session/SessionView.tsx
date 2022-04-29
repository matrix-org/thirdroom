import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import { GroupCall, ObservableValue, Room, LocalMedia, CallIntent } from "@thirdroom/hydrogen-view-sdk";

import "./SessionView.css";
import { useInitEngine, EngineContextProvider } from "../../hooks/useEngine";
import { Overlay } from "./overlay/Overlay";
import { StatusBar } from "./statusbar/StatusBar";
import { useRoom } from "../../hooks/useRoom";
import { useHydrogen } from "../../hooks/useHydrogen";
import { useCalls } from "../../hooks/useCalls";
import {
  useStore,
  closeOverlay,
  loadWorld,
  setIsPointerLock,
  setIsEnteredWorld,
  openOverlay,
  openWorldChat,
  closeWorldChat,
} from "../../hooks/useStore";
import { createMatrixNetworkInterface } from "../../../engine/network/createMatrixNetworkInterface";
import { useAsyncObservableValue } from "../../hooks/useAsyncObservableValue";
import { useKeyDown } from "../../hooks/useKeyDown";
import { usePointerLockChange } from "../../hooks/usePointerLockChange";

export interface SessionOutletContext {
  loadedWorld?: Room;
  activeCall?: GroupCall;
  canvasRef: RefObject<HTMLCanvasElement>;
}

export function SessionView() {
  const { client, session, platform } = useHydrogen(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useInitEngine(canvasRef);
  const networkInterfaceRef = useRef<() => void>();
  const isOverlayOpen = useStore((state) => state.overlay.isOpen);

  const navigate = useNavigate();

  const location = useLocation();
  const homeMatch = useMatch({ path: "/", end: true });
  const isHome = homeMatch !== null;

  const worldMatch = useMatch({ path: "world/:worldId" });
  const loadedWorldId = useStore((state) => state.world.loadedWorldId);
  const loadedWorld = useRoom(session, loadedWorldId);

  useEffect(() => {
    const newLoadedWId = worldMatch ? worldMatch.params["worldId"] || location.hash : undefined;
    loadWorld(newLoadedWId);
  }, [worldMatch, location]);

  const { value: powerLevels } = useAsyncObservableValue(
    () => (loadedWorld ? loadedWorld.observePowerLevels() : Promise.resolve(new ObservableValue(undefined))),
    [loadedWorld]
  );
  const calls = useCalls(session);
  const activeCall = useMemo(() => {
    const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.roomId === loadedWorldId ? call : []));
    return roomCalls.length ? roomCalls[0] : undefined;
  }, [calls, loadedWorldId]);

  const onLeftWorld = useCallback(() => {
    loadWorld(undefined);
    setIsEnteredWorld(false);
    document.exitPointerLock();

    if (activeCall) {
      activeCall.leave();
    }

    if (networkInterfaceRef.current) {
      networkInterfaceRef.current();
    }
  }, [activeCall]);
  const onEnteredWorld = useCallback(() => {
    closeOverlay();
    setIsEnteredWorld(true);
    canvasRef.current?.requestPointerLock();

    if (import.meta.env.VITE_USE_TESTNET) {
      engine?.startTestNet();
      return;
    }

    if (engine && activeCall && powerLevels) {
      networkInterfaceRef.current = createMatrixNetworkInterface(engine, client, powerLevels, activeCall);
    }
  }, [client, engine, activeCall, powerLevels]);

  const onLoadWorld = useCallback(
    async (room: Room) => {
      const isEnteredWorld = useStore.getState().world.isEnteredWorld;
      if (isEnteredWorld) {
        onLeftWorld();
      }

      navigate(`/world/${room.id}`);
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

      onEnteredWorld();
    },
    [platform, session, calls, onEnteredWorld]
  );

  useKeyDown((e) => {
    if (e.key === "Escape") {
      const { isChatOpen } = useStore.getState().world;
      if (isChatOpen) {
        canvasRef.current?.requestPointerLock();
        closeWorldChat();
      } else if (useStore.getState().overlay.isOpen) {
        canvasRef.current?.requestPointerLock();
        closeOverlay();
      } else {
        document.exitPointerLock();
        openOverlay();
      }
    }
    if (e.key === "Enter") {
      const { isChatOpen } = useStore.getState().world;
      if (!isChatOpen) {
        document.exitPointerLock();
        openWorldChat();
      }
    }
  }, []);

  usePointerLockChange(
    canvasRef.current,
    (isLocked) => {
      setIsPointerLock(isLocked);
    },
    []
  );

  const outletContext = useMemo<SessionOutletContext>(
    () => ({
      loadedWorld,
      activeCall,
      canvasRef,
      onEnteredWorld,
      onLeftWorld,
    }),
    [loadedWorld, activeCall, canvasRef, onEnteredWorld, onLeftWorld]
  );

  const { isEnteredWorld } = useStore.getState().world;
  return (
    <div className="SessionView">
      <canvas className="SessionView__viewport" ref={canvasRef} />
      {engine ? (
        <EngineContextProvider value={engine}>
          <Outlet context={outletContext} />
          {isOverlayOpen && <Overlay isHome={isHome} onEnterWorld={onEnterWorld} onLoadWorld={onLoadWorld} />}
          <StatusBar showOverlayTip={!isHome && isEnteredWorld} title={isHome ? "Home" : loadedWorld?.name} />
        </EngineContextProvider>
      ) : (
        <div>Initializing engine...</div>
      )}
    </div>
  );
}
