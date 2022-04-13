import { useMemo } from "react";
import { Room } from "hydrogen-view-sdk";

import { useHydrogen } from "./useHydrogen";
import { useObservableMap } from "./useObservableMap";

export function useRoomById(roomId: string): Room | undefined {
  const { session } = useHydrogen();
  const rooms = useObservableMap(session!.rooms);
  return useMemo(() => rooms.get(roomId), [rooms, roomId]);
}
