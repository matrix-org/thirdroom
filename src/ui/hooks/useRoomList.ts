import { Room, Session } from "hydrogen-view-sdk";

import { useObservableList } from "./useObservableList";

function roomListComparator(a: Room, b: Room) {
  return b.lastMessageTimestamp - a.lastMessageTimestamp;
}

export function useRoomList(session: Session): Room[] {
  return useObservableList<Room>(() => session.rooms.sortValues(roomListComparator), [session.rooms]);
}
