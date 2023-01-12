import { Session } from "@thirdroom/hydrogen-view-sdk";
import { useEffect } from "react";

import { useRoom } from "./useRoom";

export function useAutoJoinRoom(session: Session, roomIdOrAlias: string) {
  const room = useRoom(session, roomIdOrAlias);

  useEffect(() => {
    if (room === undefined) {
      session.joinRoom(roomIdOrAlias);
    }
  }, [session, roomIdOrAlias, room]);

  return room;
}
