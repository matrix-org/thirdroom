import { MatrixClient } from "@robertlong/matrix-js-sdk";
import { GroupCall } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCall";
import { fetchRoom } from "./fetchRoom";

export async function fetchGroupCall(
  client: MatrixClient,
  roomId: string
): Promise<GroupCall | undefined> {
  await fetchRoom(client, roomId);
  return client.getGroupCallForRoom(roomId) || undefined;
}
