import {
  Room,
  ObservableMap,
  HomeServerApi,
  RoomBeingCreated,
  Session,
  GroupCall,
  BaseObservableMap,
  StateEvent,
  IHomeServerRequest,
  IBlobHandle,
} from "@thirdroom/hydrogen-view-sdk";

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

export function aliasToRoomId(rooms: ObservableMap<string, Room>, alias: string) {
  for (const room of rooms.values()) {
    if (room.canonicalAlias === alias) return room.id;
  }
}

export function roomIdToAlias(rooms: ObservableMap<string, Room>, roomId: string) {
  return rooms.get(roomId)?.canonicalAlias ?? undefined;
}

export function getProfileRoom(rooms: ObservableMap<string, Room>) {
  const type = "org.matrix.msc3815.profile";
  for (const room of rooms.values()) {
    if (room.type === type) return room;
  }
}
export async function updateWorldProfile(session: Session, world: Room) {
  const profileRoom = getProfileRoom(session.rooms);

  if (profileRoom) {
    const profileEvent = await profileRoom.getStateEvent("org.matrix.msc3815.world.profile", "");

    if (profileEvent && profileEvent.event.content.avatar_url) {
      await session.hsApi.sendState(world.id, "org.matrix.msc3815.world.member", session.userId, {
        avatar_url: profileEvent.event.content.avatar_url,
      });
    }
  }
}

export async function isValidUserId(hsApi: HomeServerApi, userId: string) {
  if (!userId.match(/^@\S+:\S+$/)) return false;

  try {
    await hsApi.profile(userId).response();
    return true;
  } catch (err) {
    return false;
  }
}

export function isValidRoomId(roomId: string) {
  return roomId.match(/^!\S+:\S+$/) !== null;
}

export async function waitToCreateRoom(
  session: Session,
  roomBeingCreated: RoomBeingCreated
): Promise<Room | undefined> {
  return new Promise((resolve) => {
    const unSubs = roomBeingCreated.disposableOn("change", () => {
      unSubs();
      if (!roomBeingCreated.roomId) return resolve(undefined);
      const room = session.rooms.get(roomBeingCreated.roomId);
      resolve(room);
    });
  });
}

export async function uploadAttachment(
  hsApi: HomeServerApi,
  blob: IBlobHandle,
  onRequest?: (request: IHomeServerRequest) => void,
  onProgress?: (sentBytes: number, totalBytes: number) => void
): Promise<string> {
  const uploadRequest = await hsApi.uploadAttachment(blob, blob.nativeBlob.name, {
    uploadProgress: (sentBytes) => {
      onProgress?.(sentBytes, blob.size);
    },
  });
  onRequest?.(uploadRequest);

  const { content_uri: url, errcode, error } = await uploadRequest.response();
  if (errcode) {
    throw new Error(error ?? "Error Uploading file.");
  }
  return url;
}

export interface ParsedMatrixURI {
  protocol: "matrix:";
  authority?: string;
  mxid1: string;
  mxid2?: string;
}

const SegmentToSigil: { [key: string]: string } = {
  u: "@",
  user: "@",
  r: "#",
  room: "#",
  roomid: "!",
};

// https://github.com/matrix-org/matrix-spec-proposals/blob/main/proposals/2312-matrix-uri.md
export function parseMatrixUri(uri: string): ParsedMatrixURI | URL {
  const url = new URL(uri, window.location.href);

  if (url.protocol === "matrix:") {
    const matches = url.pathname.match(/^(\/\/.+\/)?(.+)$/);

    let authority = undefined;
    let path = undefined;

    if (matches) {
      if (matches.length == 3) {
        authority = matches[1];
        path = matches[2];
      } else if (matches.length === 2) {
        path = matches[1];
      }
    }

    if (!path) {
      throw new Error(`Invalid matrix uri "${uri}": No path provided`);
    }

    const segments = path.split("/");

    if (segments.length !== 2 && segments.length !== 4) {
      throw new Error(`Invalid matrix uri "${uri}": Invalid number of segments`);
    }

    const sigil1 = SegmentToSigil[segments[0]];

    if (!sigil1) {
      throw new Error(`Invalid matrix uri "${uri}": Invalid segment ${segments[0]}`);
    }

    if (!segments[1]) {
      throw new Error(`Invalid matrix uri "${uri}": Empty segment`);
    }

    const mxid1 = `${sigil1}${segments[1]}`;

    let mxid2: string | undefined = undefined;

    if (segments.length === 4) {
      if ((sigil1 === "!" || sigil1 === "#") && (segments[2] === "e" || segments[2] === "event") && segments[3]) {
        mxid2 = `$${segments[3]}`;
      } else {
        throw new Error(`Invalid matrix uri "${uri}": Invalid segment ${segments[2]}`);
      }
    }

    return { protocol: "matrix:", authority, mxid1, mxid2 };
  }

  return url;
}

export function parsedMatrixUriToString(uri: ParsedMatrixURI | URL) {
  return uri instanceof URL ? uri.href : uri.mxid1;
}

export function getRoomCall(calls: Map<string, GroupCall> | BaseObservableMap<string, GroupCall>, roomId?: string) {
  if (!roomId) return undefined;
  const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.roomId === roomId ? call : []));
  return roomCalls.length ? roomCalls[0] : undefined;
}

export function eventByOrderKey(ev1: StateEvent, ev2: StateEvent) {
  const o1 = ev1.content.order;
  const o2 = ev2.content.order;
  if (o1 === undefined && o2 === undefined) {
    const ts1 = ev1.origin_server_ts;
    const ts2 = ev2.origin_server_ts;

    if (ts1 === ts2) return 0;
    return ts1 > ts2 ? -1 : 1;
  }
  if (o1 === undefined) return 1;
  if (o2 === undefined) return -1;
  return o1 < o2 ? -1 : 1;
}

export async function setPowerLevel(session: Session, roomId: string, userId: string, powerLevel: number) {
  const content = await session.hsApi.state(roomId, "m.room.power_levels", "").response();
  await session.hsApi
    .sendState(roomId, "m.room.power_levels", "", {
      ...content,
      users: {
        ...content.users,
        [userId]: powerLevel,
      },
    })
    .response();
}
