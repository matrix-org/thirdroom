import { Room, Session } from "hydrogen-view-sdk";
import { useMemo } from "react";

import { useObservableList } from "./useObservableList";

function roomListComparator(a: Room, b: Room) {
  return b.lastMessageTimestamp - a.lastMessageTimestamp;
}

export function useRoomList(session: Session): Room[] {
  const rooms = session.rooms;
  const sortedRoomList = useMemo(() => rooms.sortValues(roomListComparator), [rooms]);
  const roomList = useObservableList<Room>(sortedRoomList);
  return roomList;
}
