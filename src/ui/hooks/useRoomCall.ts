import { GroupCall } from "@thirdroom/hydrogen-view-sdk";
import { useMemo } from "react";

export function useRoomCall(calls: Map<string, GroupCall>, roomId?: string) {
  return useMemo(() => {
    const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.roomId === roomId ? call : []));
    return roomCalls.length ? roomCalls[0] : undefined;
  }, [calls, roomId]);
}
