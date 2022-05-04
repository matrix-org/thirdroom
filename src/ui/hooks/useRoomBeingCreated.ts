import { RoomBeingCreated, Session } from "@thirdroom/hydrogen-view-sdk";

import { useObservableMap } from "./useObservableMap";

export function useRoomBeingCreated(session: Session, roomId: string | undefined): RoomBeingCreated | undefined {
  const roomsBeingCreated = useObservableMap(() => session.roomsBeingCreated, [session.roomsBeingCreated]);
  return roomId ? roomsBeingCreated.get(roomId) : undefined;
}
