import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useMatch } from "react-router-dom";
import { GroupCall, ObservableValue, Room } from "@thirdroom/hydrogen-view-sdk";

import "./SessionView.css";
import { useInitEngine, EngineContextProvider } from "../../hooks/useEngine";
import { Overlay } from "./overlay/Overlay";
import { StatusBar } from "./statusbar/StatusBar";
import { useRoom } from "../../hooks/useRoom";
import { useHydrogen } from "../../hooks/useHydrogen";
import { useCalls } from "../../hooks/useCalls";
import { createMatrixNetworkInterface } from "../../../engine/network/createMatrixNetworkInterface";
import { useAsyncObservableValue } from "../../hooks/useAsyncObservableValue";

export interface SessionOutletContext {
  activeWorld?: Room;
  enteredWorld: boolean;
  activeCall?: GroupCall;
  canvasRef: RefObject<HTMLCanvasElement>;
}

export function SessionView() {
  const { client, session } = useHydrogen(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useInitEngine(canvasRef);
  const networkInterfaceRef = useRef<() => void>();

  const location = useLocation();
  const homeMatch = useMatch({ path: "/", end: true });
  const isHome = homeMatch !== null;

  const worldMatch = useMatch({ path: "world/:worldId" });
  const activeWorldId = worldMatch ? worldMatch.params["worldId"] || location.hash : undefined;
  const activeWorld = useRoom(session, activeWorldId);

  const { value: powerLevels } = useAsyncObservableValue(
    () => (activeWorld ? activeWorld.observePowerLevels() : Promise.resolve(new ObservableValue(undefined))),
    [activeWorld]
  );
  const calls = useCalls(session);
  const activeCall = useMemo(() => {
    const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.roomId === activeWorldId ? call : []));
    return roomCalls.length ? roomCalls[0] : undefined;
  }, [calls, activeWorldId]);

  const [enteredWorld, setEnteredWorld] = useState(false);

  const onLeftWorld = useCallback(() => {
    setEnteredWorld(false);
    document.exitPointerLock();

    if (activeCall) {
      activeCall.leave();
    }

    if (networkInterfaceRef.current) {
      networkInterfaceRef.current();
    }
  }, [activeCall]);
  const onEnteredWorld = useCallback(() => {
    setEnteredWorld(true);
    canvasRef.current?.requestPointerLock();
    if (engine && activeCall && powerLevels) {
      networkInterfaceRef.current = createMatrixNetworkInterface(engine, client, powerLevels, activeCall);
    }
  }, [client, engine, activeCall, powerLevels]);

  const outletContext = useMemo<SessionOutletContext>(
    () => ({
      activeWorld,
      activeCall,
      canvasRef,
      enteredWorld,
      onEnteredWorld,
      onLeftWorld,
    }),
    [activeWorld, activeCall, enteredWorld, onEnteredWorld, onLeftWorld]
  );

  return (
    <div className="SessionView">
      <canvas className="SessionView__viewport" ref={canvasRef} />
      {engine ? (
        <EngineContextProvider value={engine}>
          <Outlet context={outletContext} />
          <Overlay
            isHome={isHome}
            activeWorldId={activeWorldId}
            enteredWorld={enteredWorld}
            onEnteredWorld={onEnteredWorld}
            onLeftWorld={onLeftWorld}
          />
          <StatusBar showOverlayTip={!isHome && enteredWorld} title={isHome ? "Home" : activeWorld?.name} />
        </EngineContextProvider>
      ) : (
        <div>Initializing engine...</div>
      )}
    </div>
  );
}
