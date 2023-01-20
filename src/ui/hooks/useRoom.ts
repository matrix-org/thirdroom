import { Room, Session } from "@thirdroom/hydrogen-view-sdk";

import { aliasToRoomId } from "../utils/matrixUtils";
import { useObservableMap } from "./useObservableMap";

export function useRoom(session: Session, roomIdOrAlias: string | undefined): Room | undefined {
  const roomId = roomIdOrAlias?.startsWith("#") ? aliasToRoomId(session.rooms, roomIdOrAlias) : roomIdOrAlias;

  const rooms = useObservableMap(() => session.rooms, [session.rooms]);
  return roomId ? rooms.get(roomId) : undefined;
}
