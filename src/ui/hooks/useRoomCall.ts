import { GroupCall } from "@thirdroom/hydrogen-view-sdk";
import { useMemo } from "react";

import { getRoomCall } from "../utils/matrixUtils";

export function useRoomCall(calls: Map<string, GroupCall>, roomId: string | undefined) {
  return useMemo(() => {
    return getRoomCall(calls, roomId);
  }, [calls, roomId]);
}
