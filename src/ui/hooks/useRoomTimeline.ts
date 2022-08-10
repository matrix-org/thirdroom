import { useEffect, useState } from "react";
import { Room, Timeline } from "@thirdroom/hydrogen-view-sdk";

export type TimelineType = Array<any>;

export function useRoomTimeline(room?: Room) {
  const [timeline, setTimeline] = useState<TimelineType>([]);

  useEffect(() => {
    if (!room) return;
    let unSub: () => void;
    const handleLoad = (timeline: Timeline) => {
      const entries = timeline.entries;
      unSub = entries.subscribe({
        onReset: () => setTimeline(Array.from(entries)),
        onAdd: () => setTimeline(Array.from(entries)),
        onUpdate: () => setTimeline(Array.from(entries)),
        onMove: () => setTimeline(Array.from(entries)),
        onRemove: () => setTimeline(Array.from(entries)),
      });
      setTimeline(Array.from(entries));
    };

    if (room._timeline) {
      handleLoad(room._timeline);
    } else {
      room.openTimeline().then(handleLoad);
    }
    return () => {
      unSub?.();
    };
  }, [room]);

  return timeline;
}
