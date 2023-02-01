import { useLocation, useMatch } from "react-router-dom";

import { aliasToRoomId } from "../utils/matrixUtils";
import { useHydrogen } from "./useHydrogen";

function useWorld(): [string | undefined, string | undefined, string | undefined] {
  const location = useLocation();

  const worldMatch = useMatch({ path: "world/:worldId/*" });
  const [alias, hashSearch] = location.hash.split("?");
  const reloadId = new URLSearchParams(location.search || hashSearch).get("reload") ?? undefined;

  const worldId = worldMatch?.params["worldId"] ?? undefined;
  return [worldId, alias.match(/^(#|!)\S+:\S+/) ? alias : undefined, reloadId];
}

export function useWorldPath(): [string | undefined, string | undefined] {
  const { session } = useHydrogen(true);
  const [worldId, alias, reloadId] = useWorld();

  const roomId = alias ? aliasToRoomId(session.rooms, alias) : worldId;
  if (!roomId || !session.rooms.get(roomId)) return [undefined, undefined];
  return [roomId, reloadId];
}

export function useUnknownWorldPath(): [string | undefined, string | undefined] {
  const { session } = useHydrogen(true);
  const [worldId, alias] = useWorld();

  if (worldId && session.rooms.get(worldId) === undefined) {
    return [worldId, undefined];
  }
  if (alias && aliasToRoomId(session.rooms, alias) === undefined) {
    return [undefined, alias];
  }

  return [undefined, undefined];
}
