import { useEffect, useRef, useContext, useCallback } from "react";
import { GroupCall } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCall";
import { initWorld } from "./initWorld";
import { ClientContext } from "../ui/matrix/ClientContext";

export function useWorld(
  groupCall: GroupCall,
  onChangeRoom: (roomId: string) => void,
  sceneUrl?: string
) {
  const { client } = useContext(ClientContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setSceneUrlRef = useRef<(sceneUrl: string) => Promise<void>>();

  useEffect(() => {
    let dispose: () => void | undefined;

    if (canvasRef.current) {
      initWorld(
        canvasRef.current,
        client!,
        groupCall,
        onChangeRoom,
        sceneUrl
      ).then((result) => {
        dispose = result.dispose;
        setSceneUrlRef.current = result.setSceneUrl;
      });
    }

    return () => {
      if (dispose) {
        dispose();
      }
    };
  }, [groupCall]);

  useEffect(() => {
    if (sceneUrl && setSceneUrlRef.current) {
      setSceneUrlRef.current(sceneUrl);
    }
  }, [sceneUrl]);

  return canvasRef;
}
