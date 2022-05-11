export const MX_PATH_PREFIX = "/_matrix/client/r0";

export function getMxIdDomain(mxId: string) {
  return mxId.slice(mxId.indexOf(":") + 1);
}

export async function isRoomAliasAvailable(homeserver: string, alias: string): Promise<boolean> {
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
    if (result.errcode === "M_NOT_FOUND") return true;
    return false;
  } catch {
    return false;
  }
}
