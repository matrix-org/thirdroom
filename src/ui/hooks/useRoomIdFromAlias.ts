import { Room, RoomBeingCreated, RoomType, RoomVisibility } from "@thirdroom/hydrogen-view-sdk";
import { useEffect, useState } from "react";
import { useLocation, useMatch } from "react-router-dom";

import { useHydrogen } from "./useHydrogen";
import { useObservableMap } from "./useObservableMap";
import defaultWorlds from "../../../res/defaultWorlds.json";
import { waitToCreateRoom } from "../utils/matrixUtils";

export function useWorld(): [string | undefined, Room | RoomBeingCreated | undefined, string | null] {
  const { session } = useHydrogen(true);
  const location = useLocation();
  const homeMatch = useMatch({ path: "/", end: true });
  const isHome = homeMatch !== null;
  const worldMatch = useMatch({ path: "world/:worldId/*" });
  const [alias, hashSearch] = location.hash.split("?");
  const reloadId = new URLSearchParams(location.search || hashSearch).get("reload");
  const worldId = worldMatch && worldMatch.params["worldId"];
  const worldIdOrAlias = alias || worldId || undefined;

  const [homeWorldId, setHomeWorldId] = useState<string>();

  useEffect(() => {
    async function run() {
      const homeAccountData = await session.getAccountData("org.matrix.msc3815.world.home");

      if (homeAccountData) {
        setHomeWorldId(homeAccountData.room_id);
      } else {
        const roomBeingCreated = await session.createRoom({
          type: RoomType.World,
          visibility: RoomVisibility.Private,
          avatar: defaultWorlds.home.defaultAvatar,
          name: "Home World",
          isEncrypted: false,
          isFederationDisabled: false,
          powerLevelContentOverride: {
            invite: 100,
            kick: 100,
            ban: 100,
            redact: 100,
            state_default: 100,
            events_default: 100,
            users_default: 100,
            events: {
              "m.room.power_levels": 100,
              "m.room.history_visibility": 100,
              "m.room.tombstone": 100,
              "m.room.encryption": 100,
              "m.room.name": 100,
              "m.room.message": 100,
              "m.room.encrypted": 100,
              "m.sticker": 100,
              "org.matrix.msc3401.call.member": 100,
              "org.matrix.msc3815.member.world": 100,
            },
            users: {
              [session.userId]: 100,
            },
          },
          initialState: [
            {
              type: "m.world",
              content: {
                scene_url: defaultWorlds.home.sceneUrl,
                scene_preview_url: defaultWorlds.home.scenePreviewUrl,
                home: true,
              },
            },
          ],
        });

        setHomeWorldId(roomBeingCreated.id);

        console.log(roomBeingCreated);

        const homeWorld = await waitToCreateRoom(session, roomBeingCreated);

        await session.setAccountData("org.matrix.msc3815.world.home", { room_id: homeWorld!.id });
      }
    }

    run().catch(console.error);
  }, [session]);

  const rooms = useObservableMap(() => session.rooms, [session.rooms]);
  const roomsBeingCreated = useObservableMap(() => session.roomsBeingCreated, [session.roomsBeingCreated]);

  if (alias) {
    for (const room of rooms.values()) {
      if (room.canonicalAlias === alias) {
        return [worldIdOrAlias, room, reloadId];
      }
    }
  } else if (worldId) {
    const room = rooms.get(worldId);

    if (room) {
      return [worldIdOrAlias, room, reloadId];
    }

    const roomBeingCreated = roomsBeingCreated.get(worldId);

    return [worldIdOrAlias, roomBeingCreated, reloadId];
  } else if (isHome && homeWorldId) {
    const room = rooms.get(homeWorldId);

    if (room) {
      return [homeWorldId, room, reloadId];
    }

    const roomBeingCreated = roomsBeingCreated.get(homeWorldId);

    return [homeWorldId, roomBeingCreated, reloadId];
  }

  return [worldIdOrAlias, undefined, reloadId];
}
