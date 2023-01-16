import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import "./SessionView.css";
import { useInitMainThreadContext, MainThreadContextProvider } from "../../hooks/useMainThread";
import { Overlay } from "./overlay/Overlay";
import { StatusBar } from "./statusbar/StatusBar";
import { useStore } from "../../hooks/useStore";
import { LoadingScreen } from "../components/loading-screen/LoadingScreen";
import { useHomeWorld } from "../../hooks/useHomeWorld";
import { useUnknownWorldPath } from "../../hooks/useWorld";
import { useAutoJoinRoom } from "../../hooks/useAutoJoinRoom";
import { useHydrogen } from "../../hooks/useHydrogen";
import config from "../../../../config.json";

export default function SessionView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);
  const { session } = useHydrogen(true);
  const isOverlayOpen = useStore((state) => state.overlay.isOpen);
  const [worldId, worldAlias] = useUnknownWorldPath();
  const homeWorldId = useHomeWorld();
  useAutoJoinRoom(session, config.repositoryRoomIdOrAlias);

  useEffect(() => {
    if (!worldId && !worldAlias && homeWorldId) {
      useStore.getState().overlayWorld.selectWorld(homeWorldId);
    }
  }, [worldId, worldAlias, homeWorldId]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="SessionView">
        <canvas className="SessionView__viewport" ref={canvasRef} />
        {mainThread ? (
          <MainThreadContextProvider value={mainThread}>
            <Outlet />
            {isOverlayOpen && <Overlay />}
            <StatusBar />
          </MainThreadContextProvider>
        ) : (
          <LoadingScreen message="Initializing engine..." />
        )}
      </div>
    </DndProvider>
  );
}
