import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { Room } from "hydrogen-view-sdk";

import "./SessionView.css";
import { useInitEngine, EngineContextProvider } from "../../hooks/useEngine";
import { Overlay } from "./overlay/Overlay";
import { usePointerLockState } from "../../hooks/usePointerLockState";
import { StatusBar } from "./statusbar/StatusBar";
import { useWorldId } from "../../hooks/useWorldId";
import { useRoomById } from "../../hooks/useRoomById";

export interface SessionViewContext {
  overlayOpen: boolean;
}

export function SessionView() {
  const composerInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useInitEngine(canvasRef);
  const isPointerLocked = usePointerLockState(canvasRef.current);
  const [forceOverlayClosed, setForceOverlayClosed] = useState(false);
  const isOverlayOpen = !isPointerLocked && !forceOverlayClosed;
  const homeMatch = useMatch({ path: "/", end: true });
  const isHome = homeMatch !== null;

  const worldId = useWorldId();
  const world = useRoomById(worldId);

  const navigate = useNavigate();

  const onLoadWorld = useCallback(
    async (room: Room) => {
      console.log("onLoadWorld", room);
      navigate(`/world/${room.id}`);
      return;
    },
    [navigate]
  );

  const onEnterWorld = useCallback(async () => {
    canvasRef.current!.requestPointerLock();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && isPointerLocked) {
        setForceOverlayClosed(true);
        document.exitPointerLock();
        composerInputRef.current?.focus();
      }

      if (event.key === "Escape" && !isPointerLocked && forceOverlayClosed) {
        setForceOverlayClosed(false);
        canvasRef.current?.requestPointerLock();
      }
    };

    const canvas = canvasRef.current!;

    const onCanvasClick = (event: MouseEvent) => {
      if (!isPointerLocked) {
        setForceOverlayClosed(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("click", onCanvasClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("click", onCanvasClick);
    };
  }, [isPointerLocked, forceOverlayClosed]);

  return (
    <div className="SessionView">
      <canvas className="SessionView__viewport" ref={canvasRef} />
      {engine ? (
        <EngineContextProvider value={engine}>
          <Outlet context={{ composerInputRef }} />
          <Overlay
            isOpen={isOverlayOpen}
            isHome={isHome}
            initialWorldId={worldId}
            onLoadWorld={onLoadWorld}
            onEnterWorld={onEnterWorld}
          />
          <StatusBar showOverlayTip={!isHome} overlayOpen={isOverlayOpen} title={isHome ? "Home" : world?.name} />
        </EngineContextProvider>
      ) : (
        <div>Initializing engine...</div>
      )}
    </div>
  );
}
