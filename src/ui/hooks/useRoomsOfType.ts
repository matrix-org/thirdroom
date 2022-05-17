import { useState } from "react";
import { Room, Session } from "@thirdroom/hydrogen-view-sdk";

import { useObservableList } from "./useObservableList";

function roomListComparator(a: Room, b: Room) {
  return b.lastMessageTimestamp - a.lastMessageTimestamp;
}

export enum RoomType {
  Room = "m.room",
  Direct = "m.direct",
  World = "m.world",
}

export function useRoomsOfType(session: Session, initialType: RoomType): [Room[], (type: RoomType) => void] {
  const [type, setType] = useState(initialType);

  return [
    useObservableList(() => {
      const roomFilter = (room: Room) => {
        // TODO:
        if (type === RoomType.Direct) return true;
        if (type === RoomType.World) return true;
        return true;
      };
      return session.rooms.filterValues(roomFilter).sortValues(roomListComparator);
    }, [session.rooms, type]),
    setType,
  ];
}
