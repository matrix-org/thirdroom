import { ObservableMap, Room, StateEvent } from "@thirdroom/hydrogen-view-sdk";
import { useEffect, useState } from "react";

import { useIsMounted } from "./useIsMounted";
import { useObservableMap } from "./useObservableMap";

export function useStateEvents(room: Room, eventType: string) {
  const [eventObservable, setEventObservable] = useState(new ObservableMap<string, StateEvent>());
  const isMounted = useIsMounted();

  // FIXME: merge https://github.com/vector-im/hydrogen-web/commit/32835e26b9b2435dc7db32d76a82cf698ee11216 in @thirdroom/hydrogen-view-sdk
  const events = useObservableMap(() => eventObservable, [eventObservable]);

  useEffect(() => {
    room.observeStateType(eventType).then((stateObserver) => {
      if (!isMounted()) return;
      setEventObservable(stateObserver);
    });
  }, [eventType, room, isMounted]);

  return events;
}
