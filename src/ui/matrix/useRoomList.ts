import { useContext, useEffect, useState } from "react";
import { MatrixClient, Room } from "@robertlong/matrix-js-sdk";
import { ClientContext } from "./ClientContext";

const tsCache: { [key: string]: number } = {};

function getLastTs(client: MatrixClient, room: Room) {
  if (tsCache[room.roomId]) {
    return tsCache[room.roomId];
  }

  if (!room || !room.timeline) {
    const ts = Number.MAX_SAFE_INTEGER;
    tsCache[room.roomId] = ts;
    return ts;
  }

  const myUserId = client.getUserId();

  if (room.getMyMembership() !== "join") {
    const membershipEvent = room.currentState.getStateEvents(
      "m.room.member",
      myUserId
    );

    if (membershipEvent && !Array.isArray(membershipEvent)) {
      const ts = membershipEvent.getTs();
      tsCache[room.roomId] = ts;
      return ts;
    }
  }

  for (let i = room.timeline.length - 1; i >= 0; --i) {
    const ev = room.timeline[i];
    const ts = ev.getTs();

    if (ts) {
      tsCache[room.roomId] = ts;
      return ts;
    }
  }

  const ts = Number.MAX_SAFE_INTEGER;
  tsCache[room.roomId] = ts;
  return ts;
}

function sortRooms(client: MatrixClient, rooms: Room[]): Room[] {
  return rooms.sort((a, b) => {
    return getLastTs(client, b) - getLastTs(client, a);
  });
}

export function useRoomList() {
  const { client } = useContext(ClientContext);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    function updateRooms() {
      if (!client) {
        return;
      }

      const visibleRooms = client.getVisibleRooms();
      const sortedRooms = sortRooms(client, visibleRooms);
      setRooms(sortedRooms);
    }

    if (client) {
      client.on("Room", updateRooms);
      updateRooms();
    }

    return () => {
      if (client) {
        client.removeListener("Room", updateRooms);
      }
    };
  }, []);

  return rooms;
}
