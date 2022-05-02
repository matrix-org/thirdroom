import { Room, MatrixClient } from "@thirdroom/matrix-js-sdk";
import { useEffect, useState } from "react";

export function useRoom(client: MatrixClient, roomId: string | undefined): Room | undefined {
  const [room, setRoom] = useState(roomId ? client.getRoom(roomId) : undefined);

  useEffect(() => {
    function onRoom(room: Room) {
      if (room.roomId === roomId) {
        setRoom(room);
      }
    }

    if (roomId) {
      setRoom(client.getRoom(roomId));
    } else {
      setRoom(undefined);
    }

    client.addListener("Room", onRoom);

    return () => {
      client.removeListener("Room", onRoom);
    };
  }, [client, roomId]);

  return room;
}
