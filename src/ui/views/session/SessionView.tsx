import { useRef } from "react";
import { Outlet } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import "./SessionView.css";
import { useInitMainThreadContext, MainThreadContextProvider } from "../../hooks/useMainThread";
import { Overlay } from "./overlay/Overlay";
import { StatusBar } from "./statusbar/StatusBar";
import { useStore } from "../../hooks/useStore";
import { LoadingScreen } from "../components/loading-screen/LoadingScreen";

export default function SessionView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);
  const isOverlayOpen = useStore((state) => state.overlay.isOpen);

  // const onWorldTransfer = useCallback(
  //   async (uri: string) => {
  //     const state = useStore.getState();

  //     const parsedUri = parseMatrixUri(uri);

  //     if (parsedUri instanceof URL) {
  //       return;
  //     }

  //     // Terminate previous world's network connection
  //     if (networkInterfaceRef.current) {
  //       networkInterfaceRef.current();
  //       networkInterfaceRef.current = undefined;
  //     }

  //     // select new world
  //     state.overlayWorld.selectWorld(parsedUri.mxid1);

  //     // join if not already
  //     const roomStatus = await session.observeRoomStatus(parsedUri.mxid1);
  //     if (roomStatus.get() !== RoomStatus.Joined) {
  //       try {
  //         useStore.getState().world.joinWorld();
  //         await session.joinRoom(parsedUri.mxid1);
  //       } catch (error) {
  //         useStore.getState().world.setWorldError(error as Error);
  //       }
  //     }

  //     // load world
  //     navigate(`/world/${roomIdToAlias(session.rooms, parsedUri.mxid1) ?? parsedUri.mxid1}`);

  //     // enter world when loaded
  //     const interval = setInterval(() => {
  //       if (useStore.getState().world.loadState === WorldLoadState.Loaded) {
  //         setShowPortalPrompt(true);
  //         clearInterval(interval);
  //       }
  //     }, 100);

  //     return () => {
  //       clearInterval(interval);
  //     };
  //   },
  //   [navigate, session]
  // );

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
