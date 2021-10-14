import { useEffect, useRef, useContext, useState, useCallback } from "react";
import { ClientContext } from "./ClientContext";
import { RoomManager, RoomManagerEvent } from "../../world/RoomManager";

export interface UseRoomManagerState<S = {}> {
  loading: boolean;
  error?: Error;
  state: S;
}

export function useRoomManager<S = {}>(
  roomManager: RoomManager<S>,
  roomId?: string
) {
  const { client } = useContext(ClientContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ loading, error, state }, setState] = useState<
    UseRoomManagerState<S>
  >({
    loading: true,
    state: roomManager.state,
  });

  useEffect(() => {
    setState((prevState) => ({ ...prevState, loading: true }));

    function onUpdateUI(state: S) {
      setState((prevState) => ({ ...prevState, state }));
    }

    function onError(error: Error) {
      setState((prevState) => ({ ...prevState, error }));
    }

    roomManager.addListener(RoomManagerEvent.UpdateUI, onUpdateUI);
    roomManager.addListener(RoomManagerEvent.Error, onError);

    roomManager
      .init(canvasRef.current!, client!)
      .then(() => setState((prevState) => ({ ...prevState, loading: false })))
      .catch((error: Error) =>
        setState((prevState) => ({ ...prevState, loading: false, error }))
      );

    return () => {
      roomManager.removeListener(RoomManagerEvent.UpdateUI, onUpdateUI);
      roomManager.removeListener(RoomManagerEvent.Error, onError);
      roomManager.dispose();
    };
  }, [client]);

  useEffect(() => {
    if (roomId) {
      setState((prevState) => ({ ...prevState, loading: true }));

      roomManager
        .loadRoom(roomId)
        .then(() => setState((prevState) => ({ ...prevState, loading: false })))
        .catch((error: Error) =>
          setState((prevState) => ({ ...prevState, loading: false, error }))
        );
    }

    return () => {
      if (roomId) {
        roomManager.unloadRoom();
      }
    };
  }, [roomManager, roomId]);

  const dispatch = useCallback(
    (event: string, ...args: any[]) => {
      roomManager.emit(event, ...args);
    },
    [roomManager]
  );

  return {
    loading,
    error,
    state,
    canvasRef,
    dispatch,
  };
}
