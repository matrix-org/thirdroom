import { Room, Session } from "hydrogen-view-sdk";

import { useObservableMap } from "./useObservableMap";

export function useRoom(session: Session, roomId: string | undefined): Room | undefined {
  const rooms = useObservableMap(() => session.rooms, [session.rooms]);
  return roomId ? rooms.get(roomId) : undefined;
}
