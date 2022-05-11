import { Room, ObservableMap } from "@thirdroom/hydrogen-view-sdk";

export const MX_PATH_PREFIX = "/_matrix/client/r0";

export function getMxIdDomain(mxId: string) {
  return mxId.slice(mxId.indexOf(":") + 1);
}

export async function resolveRoomAlias(
  homeserver: string,
  alias: string
): Promise<{
  roomId?: string;
  servers?: string[];
  errcode?: string;
  error?: string;
}> {
  const path = `${MX_PATH_PREFIX}/directory/room/${encodeURIComponent(alias)}`;
  try {
    const response = await fetch(`${homeserver}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      credentials: "same-origin",
    });
    const result = await response.json();
    if (result.room_id) {
      return {
        roomId: result.room_id,
        servers: result.servers,
      };
    }
    return result;
  } catch {
    return {
      errcode: "ERROR",
      error: "Failed to resolve",
    };
  }
}

export async function isRoomAliasAvailable(homeserver: string, alias: string): Promise<boolean> {
  const result = await resolveRoomAlias(homeserver, alias);
  if (result?.errcode === "M_NOT_FOUND") return true;
  return false;
}

export function getRoomWithAlias(rooms: ObservableMap<string, Room>, alias: string): Room | void {
  if (alias.startsWith("#") === false) return;
  const items = rooms.values();

  for (const room of items) {
    if (room.canonicalAlias === alias) return room;
  }
}
