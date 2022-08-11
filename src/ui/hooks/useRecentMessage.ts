import { Room } from "@thirdroom/hydrogen-view-sdk";

import { useRoomTimeline, TimelineType } from "./useRoomTimeline";

export function useRecentMessage(room?: Room) {
  const getRecentMessage = (timeline?: TimelineType) => {
    if (!timeline || timeline.length === 0) return undefined;
    for (let i = timeline.length - 1; i >= 0; i -= 1) {
      const entry = timeline[i];
      const event = entry?.event;
      if (event?.type === "m.room.encrypted") return entry;
      if (event?.type === "m.room.message") return entry;
    }
    return undefined;
  };

  return getRecentMessage(useRoomTimeline(room));
}
