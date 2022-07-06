import { useState } from "react";
import { Invite, Session } from "@thirdroom/hydrogen-view-sdk";

import { useObservableList } from "./useObservableList";
import { roomTypeFilter, RoomTypes } from "./useRoomsOfType";

function roomListComparator(a: Invite, b: Invite) {
  return b.timestamp - a.timestamp;
}

export function useInvitesOfType(session: Session, initialType: RoomTypes): [Invite[], (type: RoomTypes) => void] {
  const [type, setType] = useState(initialType);

  return [
    useObservableList(() => {
      return session.invites.filterValues((invite) => roomTypeFilter(invite, type)).sortValues(roomListComparator);
    }, [session.invites, type]),
    setType,
  ];
}
