import { useEffect } from "react";
import { Room, StateEvent } from "@thirdroom/hydrogen-view-sdk";

import { useIsMounted } from "./useIsMounted";

export function useStateEventKeyCallback(
  room: Room,
  eventType: string,
  stateKey: string,
  callback: (stateEvent: StateEvent | undefined) => void
) {
  const isMounted = useIsMounted();

  useEffect(() => {
    let unSub: () => void;
    room.observeStateTypeAndKey(eventType, stateKey).then((stateObservable) => {
      if (!isMounted()) return;
      const event = stateObservable.get();
      callback(event);
      unSub = stateObservable.subscribe(callback);
    });
    return () => unSub?.();
  }, [room, eventType, stateKey, callback, isMounted]);
}
