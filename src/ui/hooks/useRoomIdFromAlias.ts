import { useState, useEffect } from "react";

import { useHydrogen } from "./useHydrogen";
import { useIsMounted } from "./useIsMounted";
import { getRoomWithAlias, resolveRoomAlias } from "../utils/matrixUtils";

export function useRoomIdFromAlias(alias?: string) {
  const { session } = useHydrogen(true);
  const { homeserver } = session.sessionInfo;
  const [roomId, setRoomId] = useState<string>();
  const isMounted = useIsMounted();

  useEffect(() => {
    if (typeof alias !== "string" || alias.startsWith("#") === false) {
      setRoomId(undefined);
      return;
    }
    const room = getRoomWithAlias(session.rooms, alias);
    if (room) {
      setRoomId(room.id);
    } else {
      resolveRoomAlias(homeserver, alias).then((result) => {
        if (!isMounted) return;
        if (result.roomId) setRoomId(result.roomId);
        else setRoomId(undefined);
      });
    }
  }, [session, homeserver, alias, isMounted]);

  return roomId;
}
