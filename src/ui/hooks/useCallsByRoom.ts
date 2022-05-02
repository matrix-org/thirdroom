import { GroupCall, MatrixClient } from "@thirdroom/matrix-js-sdk";
import { useMemo } from "react";

import { useCalls } from "./useCalls";

export function useCallsByRoom(client: MatrixClient, roomId: string): GroupCall[] {
  const calls = useCalls(client);
  return useMemo(() => Array.from(calls.values()).filter((call) => call.room.roomId === roomId) || [], [roomId, calls]);
}
