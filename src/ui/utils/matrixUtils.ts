import {
  Room,
  ObservableMap,
  AttachmentUpload,
  Platform,
  IBlobHandle,
  HomeServerApi,
  RoomBeingCreated,
  Session,
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
  if (!userId.match(/^@\S+:\S+$/)) return false;

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

export async function uploadAttachment(
  hsApi: HomeServerApi,
  platform: Platform,
  blob: IBlobHandle,
  onAttachmentCreate?: (attachment: AttachmentUpload) => void,
  onProgress?: (sentBytes: number, totalBytes: number) => void
) {
  const attachment = new AttachmentUpload({ filename: blob.nativeBlob.name, blob, platform });
  onAttachmentCreate?.(attachment);

  await attachment.upload(hsApi, () => {
    onProgress?.(attachment.sentBytes, attachment.size);
  });

  const content = {} as { url?: string };
  attachment.applyToContent("url", content);
  return content.url;
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
