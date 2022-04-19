import { ObservableValue, Session } from "@thirdroom/hydrogen-view-sdk";

import { useAsyncObservableValue } from "./useAsyncObservableValue";

export function useRoomStatus(session: Session, roomId?: string) {
  return useAsyncObservableValue(
    () => (roomId ? session.observeRoomStatus(roomId) : Promise.resolve(new ObservableValue(undefined))),
    [session, roomId]
  );
}
