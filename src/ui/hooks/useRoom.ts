import { useMemo } from "react";
import { Room, Session } from "hydrogen-view-sdk";

import { useObservableMap } from "./useObservableMap";

export function useRoom(session: Session, roomId: string | undefined): Room | undefined {
  const rooms = useObservableMap(session.rooms);
  return useMemo(() => (roomId ? rooms.get(roomId) : undefined), [rooms, roomId]);
}
