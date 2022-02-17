import { useContext, useEffect } from "react";
import { Room } from "@robertlong/matrix-js-sdk";
import { useProfile } from "./useProfile";
import { ClientContext } from "./ClientContext";

export const ROOM_PROFILE_KEY = "me.robertlong.profile";

export function useRoomProfile(room?: Room) {
  const { client } = useContext(ClientContext);
  const { avatarUrl, avatarMxcUrl } = useProfile();

  useEffect(() => {
    if (client && room) {
      const userId = client.getUserId();

      const currentMemberState = room.currentState.getStateEvents(
        "m.room.member",
        userId
      );
      const currentMemberStateContent = currentMemberState.getContent();
      const currentProfile = currentMemberStateContent[ROOM_PROFILE_KEY];

      console.log(currentProfile, avatarMxcUrl);

      if (!currentProfile || currentProfile.avatarMxcUrl !== avatarMxcUrl) {
        client.sendStateEvent(
          room.roomId,
          "m.room.member",
          {
            ...currentMemberState.getContent(),
            [ROOM_PROFILE_KEY]: {
              avatarMxcUrl,
            },
          },
          userId
        );
      }
    }
  }, [client, room, avatarMxcUrl]);

  return { avatarUrl };
}
