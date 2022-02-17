import { useCallback, useContext, useEffect, useState } from "react";
import { Room, MatrixEvent, RoomState } from "@robertlong/matrix-js-sdk";
import { ClientContext } from "./ClientContext";

export function useScene(room?: Room) {
  const { client } = useContext(ClientContext);
  const [sceneUrl, setSceneUrl] = useState<string | undefined>();

  useEffect(() => {
    function onRoomStateEvents(
      event: MatrixEvent,
      _state: RoomState,
      _prevEvent: MatrixEvent
    ) {
      if (
        room &&
        client &&
        event.getRoomId() === room.roomId &&
        event.getType() === "me.robertlong.scene"
      ) {
        const stateEvents = room.currentState.getStateEvents(
          "me.robertlong.scene"
        );

        if (stateEvents.length > 0) {
          const mxcSceneUrl = stateEvents[0].getContent().sceneUrl;

          if (mxcSceneUrl) {
            setSceneUrl(client.mxcUrlToHttp(mxcSceneUrl) || undefined);
          }
        }
      }
    }

    if (client && room) {
      const stateEvents = room.currentState.getStateEvents(
        "me.robertlong.scene"
      );

      if (stateEvents.length > 0) {
        const mxcSceneUrl = stateEvents[0].getContent().sceneUrl;

        if (mxcSceneUrl) {
          setSceneUrl(client.mxcUrlToHttp(mxcSceneUrl) || undefined);
        }
      }

      client.on("RoomState.events", onRoomStateEvents);
    }

    return () => {
      if (client) {
        client.removeListener("RoomState.events", onRoomStateEvents);
      }
    };
  }, [room]);

  const changeSceneUrl = useCallback(async (newMxcSceneUrl: string): Promise<string | undefined> => {
    if (!client || !room) {
      throw new Error("Room is not set");
    }

    await client.sendStateEvent(
      room.roomId,
      "me.robertlong.scene",
      {
        sceneUrl: newMxcSceneUrl,
      },
      ""
    )

    const sceneUrl = client.mxcUrlToHttp(newMxcSceneUrl) || undefined;

    setSceneUrl(sceneUrl);

    return sceneUrl;
  }, [room, client]);

  const uploadAndChangeScene = useCallback(async (scene: File | Blob): Promise<string | undefined> => {
    if (!client || !room) {
      throw new Error("Room is not set");
    }

    const newMxcSceneUrl = await client.uploadContent(scene);

    return changeSceneUrl(newMxcSceneUrl);
  }, [room, client, changeSceneUrl]);

  return { sceneUrl, changeSceneUrl, uploadAndChangeScene };
}