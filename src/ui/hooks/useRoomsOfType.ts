import { useState } from "react";
import { Room, Invite, Session } from "@thirdroom/hydrogen-view-sdk";

import { useObservableList } from "./useObservableList";

function roomListComparator(a: Room, b: Room) {
  return b.lastMessageTimestamp - a.lastMessageTimestamp;
}

export enum RoomTypes {
  World,
  Room,
  Direct,
}

export const roomTypeFilter = (room: Room | Invite, type: RoomTypes) => {
  if (type === RoomTypes.World) return room.type === "org.matrix.msc3815.world";
  if (type === RoomTypes.Room && !room.type && !room.isDirectMessage) return true;
  if (type === RoomTypes.Direct) return room.isDirectMessage;
  return false;
};

export function useRoomsOfType(session: Session, initialType: RoomTypes): [Room[], (type: RoomTypes) => void] {
  const [type, setType] = useState(initialType);

  return [
    useObservableList(() => {
      return session.rooms.filterValues((room) => roomTypeFilter(room, type)).sortValues(roomListComparator);
    }, [session.rooms, type]),
    setType,
  ];
}
