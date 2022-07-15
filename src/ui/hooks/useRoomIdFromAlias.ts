import { Room, RoomBeingCreated } from "@thirdroom/hydrogen-view-sdk";
import { useLocation, useMatch } from "react-router-dom";

import { useHydrogen } from "./useHydrogen";
import { useObservableMap } from "./useObservableMap";

export function useWorld(): [string | undefined, Room | RoomBeingCreated | undefined] {
  const { session } = useHydrogen(true);
  const location = useLocation();
  const worldMatch = useMatch({ path: "world/:worldId/*" });
  const alias = location.hash;
  const worldId = worldMatch && worldMatch.params["worldId"];
  const worldIdOrAlias = alias || worldId || undefined;

  const rooms = useObservableMap(() => session.rooms, [session.rooms]);
  const roomsBeingCreated = useObservableMap(() => session.roomsBeingCreated, [session.roomsBeingCreated]);

  if (alias) {
    for (const room of rooms.values()) {
      if (room.canonicalAlias === alias) {
        return [worldIdOrAlias, room];
      }
    }
  } else if (worldId) {
    const room = rooms.get(worldId);

    if (room) {
      return [worldIdOrAlias, room];
    }

    const roomBeingCreated = roomsBeingCreated.get(worldId);

    return [worldIdOrAlias, roomBeingCreated];
  }

  return [worldIdOrAlias, undefined];
}
