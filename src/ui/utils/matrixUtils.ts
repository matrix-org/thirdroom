import { Room, ObservableMap, HomeServerApi, RoomBeingCreated, Session } from "@thirdroom/hydrogen-view-sdk";

export const MX_PATH_PREFIX = "/_matrix/client/r0";

export function getMxIdDomain(mxId: string) {
  return mxId.slice(mxId.indexOf(":") + 1);
}

export function getMxIdUsername(mxId: string) {
  return mxId.slice(1, mxId.indexOf(":"));
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

  for (const room of rooms.values()) {
    if (room.canonicalAlias === alias) return room;
  }
}

export function getProfileRoom(rooms: ObservableMap<string, Room>) {
  const type = "org.matrix.msc3815.profile";
  for (const room of rooms.values()) {
    if (room.type === type) return room;
  }
}

export async function isValidUserId(hsApi: HomeServerApi, userId: string) {
  if (!userId.match(/^@.+:.+$/)) return false;

  try {
    await hsApi.profile(userId).response();
    return true;
  } catch (err) {
    return false;
  }
}

export async function waitToCreateRoom(
  session: Session,
  roomBeingCreated: RoomBeingCreated
): Promise<Room | undefined> {
  return new Promise((resolve) => {
    const unSubs = roomBeingCreated.disposableOn("change", () => {
      unSubs();
      if (!roomBeingCreated.roomId) return resolve(undefined);
      const profileRoom = session.rooms.get(roomBeingCreated.roomId);
      if (!profileRoom) return resolve(undefined);
      resolve(profileRoom);
    });
  });
}
