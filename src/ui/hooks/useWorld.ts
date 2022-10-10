import { useLocation, useMatch } from "react-router-dom";

import { aliasToRoomId } from "../utils/matrixUtils";
import { useHydrogen } from "./useHydrogen";

export function useWorldPath(): [string | undefined, string | undefined] {
  const { session } = useHydrogen(true);
  const location = useLocation();

  const worldMatch = useMatch({ path: "world/:worldId/*" });
  const [alias, hashSearch] = location.hash.split("?");
  const reloadId = new URLSearchParams(location.search || hashSearch).get("reload") ?? undefined;
  const worldId = worldMatch?.params["worldId"] ?? undefined;

  const roomId = alias ? aliasToRoomId(session.rooms, alias) : worldId;
  if (!roomId || !session.rooms.get(roomId)) return [undefined, undefined];
  return [roomId, reloadId];
}
