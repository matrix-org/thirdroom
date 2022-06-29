import { useState } from "react";
import { Invite, Session } from "@thirdroom/hydrogen-view-sdk";

import { useObservableList } from "./useObservableList";
import { RoomTypes } from "./useRoomsOfType";

function roomListComparator(a: Invite, b: Invite) {
  return b.timestamp - a.timestamp;
}

export function useInvitesOfType(session: Session, initialType: RoomTypes): [Invite[], (type: RoomTypes) => void] {
  const [type, setType] = useState(initialType);

  return [
    useObservableList(() => {
      const roomFilter = (room: Invite) => {
        if (type === RoomTypes.World) return room.type === "org.matrix.msc3815.world";
        if (type === RoomTypes.Room && !room.type) return true;
        if (type === RoomTypes.Direct) return room.isDirectMessage;
        return false;
      };
      return session.invites.filterValues(roomFilter).sortValues(roomListComparator);
    }, [session.invites, type]),
    setType,
  ];
}
