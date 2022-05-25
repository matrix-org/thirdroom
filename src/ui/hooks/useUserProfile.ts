import { useEffect, useState } from "react";
import produce from "immer";
import { Session } from "@thirdroom/hydrogen-view-sdk";

import { getMxIdUsername } from "../utils/matrixUtils";
import { useIsMounted } from "./useIsMounted";

interface UserProfile {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
}

export function useUserProfile(session: Session) {
  const [user, setUser] = useState<UserProfile>({
    userId: session.userId,
    displayName: getMxIdUsername(session.userId),
  });
  const isMounted = useIsMounted();

  useEffect(() => {
    session.hsApi
      .profile(session.userId)
      .response()
      .then((data) => {
        if (!isMounted) return;
        setUser(
          produce((draft) => {
            draft.displayName = data.displayname;
            draft.avatarUrl = data.avatar_url;
          })
        );
      });

    return session.observeRoomState({
      // TODO: update user profile
      // Maybe we can move it to global store?
      handleRoomState: (room, stateEvent) => {
        console.log("--- State change ---");
        console.log(room, stateEvent);
      },
      updateRoomMembers: (room, memberChanges) => {
        console.log("---Member change---");
        console.log(room, memberChanges);
      },
    });
  }, [session, isMounted]);

  return user;
}
