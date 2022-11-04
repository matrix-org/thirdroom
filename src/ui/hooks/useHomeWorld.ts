import { RoomType, RoomVisibility, Session } from "@thirdroom/hydrogen-view-sdk";
import { useEffect, useState } from "react";

import defaultWorlds from "../../../res/defaultWorlds.json";
import { waitToCreateRoom } from "../utils/matrixUtils";
import { useHydrogen } from "./useHydrogen";

async function createHomeWorld(session: Session) {
  return await session.createRoom({
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
      users_default: 0,
      events: {
        "m.room.power_levels": 100,
        "m.room.history_visibility": 100,
        "m.room.tombstone": 100,
        "m.room.encryption": 100,
        "m.room.name": 100,
        "m.room.message": 0,
        "m.room.encrypted": 100,
        "m.sticker": 0,
        "org.matrix.msc3401.call.member": 0,
        "org.matrix.msc3815.member.world": 0,
      },
      users: {
        [session.userId]: 100,
      },
    },
    initialState: [
      {
        type: "org.matrix.msc3815.world",
        content: {
          version: defaultWorlds.home.version,
          scene_url: defaultWorlds.home.sceneUrl,
          scene_preview_url: defaultWorlds.home.scenePreviewUrl,
          home: true,
        },
      },
    ],
  });
}

interface HomeWorldAccountData {
  version?: number;
  room_id: string;
}

async function updateHomeWorld(session: Session, accountData: HomeWorldAccountData) {
  const room = session.rooms.get(accountData.room_id);

  if (!room) {
    throw new Error("Home world not found");
  }

  await session.hsApi
    .sendState(room.id, "org.matrix.msc3815.world", "", {
      scene_url: defaultWorlds.home.sceneUrl,
      scene_preview_url: defaultWorlds.home.scenePreviewUrl,
    })
    .response();
}

export function useHomeWorld() {
  const { session } = useHydrogen(true);
  const [homeWorldId, setHomeWorldId] = useState<string>();

  useEffect(() => {
    async function run() {
      const homeAccountData = await session.getAccountData("org.matrix.msc3815.world.home");

      if (
        homeAccountData &&
        homeAccountData.version &&
        homeAccountData.version >= 4 &&
        session.rooms.get(homeAccountData.room_id)
      ) {
        if (homeAccountData.version < defaultWorlds.home.version) {
          await updateHomeWorld(session, homeAccountData);

          await session.setAccountData("org.matrix.msc3815.world.home", {
            version: defaultWorlds.home.version,
            room_id: homeAccountData.room_id,
          });
        }

        setHomeWorldId(homeAccountData.room_id);
      } else {
        if (homeAccountData && homeAccountData.version && homeAccountData.version <= 3) {
          await session.rooms.get(homeAccountData.room_id)?.leave();
        }

        const roomBeingCreated = await createHomeWorld(session);
        const homeWorld = await waitToCreateRoom(session, roomBeingCreated);
        setHomeWorldId(homeWorld!.id);

        await session.setAccountData("org.matrix.msc3815.world.home", {
          version: defaultWorlds.home.version,
          room_id: homeWorld!.id,
        });
      }
    }

    run().catch(console.error);
  }, [session]);

  return homeWorldId;
}
