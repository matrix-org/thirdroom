import { useState, useEffect } from "react";
import { Room, MatrixClient } from "@thirdroom/matrix-js-sdk";

function roomListComparator(a: Room, b: Room) {
  return b.getLastActiveTimestamp() - a.getLastActiveTimestamp();
}

export function useRoomList(client: MatrixClient) {
  const [rooms, setRooms] = useState(() => [...client.getRooms()].sort(roomListComparator));

  useEffect(() => {
    function onRoom() {
      setRooms([...client.getRooms()].sort(roomListComparator));
    }

    setRooms([...client.getRooms()].sort(roomListComparator));

    client.addListener("Room", onRoom);

    return () => {
      client.removeListener("Room", onRoom);
    };
  }, [client]);

  return rooms;
}
