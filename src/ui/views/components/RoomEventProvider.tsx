import { useEffect, useState } from "react";
import { Session, TimelineEvent } from "@thirdroom/hydrogen-view-sdk";

function useRoomEvent(session: Session, roomId: string, eventId: string): TimelineEvent | undefined {
  const [event, setEvent] = useState<TimelineEvent>();

  useEffect(() => {
    let unmounted = false;
    session.hsApi
      .event(roomId, eventId)
      .response()
      .then((result) => {
        if (unmounted) return;
        if (!result.event_id) return;
        setEvent(result);
      });
    return () => {
      unmounted = true;
    };
  }, [session, roomId, eventId]);

  return event;
}

interface RoomEventProviderProps {
  session: Session;
  roomId: string;
  eventId: string;
  fallback: () => JSX.Element;
  children: (event: TimelineEvent) => JSX.Element | null;
}
export function RoomEventProvider({ session, roomId, eventId, fallback, children }: RoomEventProviderProps) {
  const event = useRoomEvent(session, roomId, eventId);
  if (!event) return fallback();
  return children(event);
}
