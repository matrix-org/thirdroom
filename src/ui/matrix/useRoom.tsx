import { useContext, useEffect, useState } from "react";
import { Room } from "@robertlong/matrix-js-sdk";
import { ClientContext } from "./ClientContext";
import { fetchRoom } from "./fetchRoom";

export function useRoom(roomId: string) {
  const { client } = useContext(ClientContext);
  const [room, setRoom] = useState<Room | undefined>();
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    if (client) {
      fetchRoom(client, roomId).then(setRoom).catch(setError);
    }
  }, [roomId]);

  return { loading: !room && !error, room, error };
}
