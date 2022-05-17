import { useState } from "react";
import { Room, Session } from "@thirdroom/hydrogen-view-sdk";

import { useObservableList } from "./useObservableList";

function roomListComparator(a: Room, b: Room) {
  return b.lastMessageTimestamp - a.lastMessageTimestamp;
}

export enum RoomTypes {
  World,
  Room,
  Direct,
}

export function useRoomsOfType(session: Session, initialType: RoomTypes): [Room[], (type: RoomTypes) => void] {
  const [type, setType] = useState(initialType);

  return [
    useObservableList(() => {
      const roomFilter = (room: Room) => {
        if (type === RoomTypes.World) return room.type === "org.matrix.msc3815.world";
        if (type === RoomTypes.Room && !room.type) return true;
        if (type === RoomTypes.Direct) return room.isDirectMessage;
        return false;
      };
      return session.rooms.filterValues(roomFilter).sortValues(roomListComparator);
    }, [session.rooms, type]),
    setType,
  ];
}
