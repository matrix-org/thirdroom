import { ObservableMap, Room, StateEvent } from "@thirdroom/hydrogen-view-sdk";
import { useEffect, useState } from "react";

import { useIsMounted } from "./useIsMounted";
import { useObservableMap } from "./useObservableMap";

export function useStateEvents(room: Room, eventType: string) {
  const [eventObservable, setEventObservable] = useState(new ObservableMap<string, StateEvent>());
  const isMounted = useIsMounted();

  const events = useObservableMap(() => eventObservable, [eventObservable]);

  useEffect(() => {
    room.observeStateType(eventType).then((stateObserver) => {
      if (!isMounted()) return;
      setEventObservable(stateObserver);
    });
  }, [eventType, room, isMounted]);

  return events;
}
