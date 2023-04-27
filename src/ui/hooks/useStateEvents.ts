import { ObservableMap, Room, StateEvent } from "@thirdroom/hydrogen-view-sdk";
import { useEffect, useState } from "react";

import { useIsMounted } from "./useIsMounted";
import { useObservableMap } from "./useObservableMap";

export function useStateEvents(room: Room | undefined, eventType: string) {
  const [eventObservable, setEventObservable] = useState(new ObservableMap<string, StateEvent>());
  const isMounted = useIsMounted();

  const events = useObservableMap(() => eventObservable, [eventObservable]);

  useEffect(() => {
    if (!room) {
      setEventObservable(new ObservableMap<string, StateEvent>());
    } else {
      room.observeStateType(eventType).then((stateObserver) => {
        if (!isMounted()) return;
        setEventObservable(stateObserver);
      });
    }
  }, [eventType, room, isMounted]);

  return events;
}
