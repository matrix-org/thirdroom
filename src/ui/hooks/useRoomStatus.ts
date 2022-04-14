import { useMemo } from "react";
import { ObservableValue, Session } from "hydrogen-view-sdk";

import { useAsyncObservableValue } from "./useAsyncObservableValue";

export function useRoomStatus(session: Session, roomId?: string) {
  const roomStatusObservablePromise = useMemo(
    () => (roomId ? session.observeRoomStatus(roomId) : Promise.resolve(new ObservableValue(undefined))),
    [session, roomId]
  );
  return useAsyncObservableValue(roomStatusObservablePromise);
}
