import { useCallback, useEffect } from "react";
import { Session } from "@thirdroom/hydrogen-view-sdk";

import { getMxIdUsername } from "../utils/matrixUtils";
import { useStore } from "./useStore";
import { useIsMounted } from "./useIsMounted";

export function useUserProfile(session?: Session) {
  const isMounted = useIsMounted();

  const updateProfile = useCallback((userId: string, displayName?: string, avatarUrl?: string) => {
    const { setUserId, setDisplayName, setAvatarUrl } = useStore.getState().userProfile;
    setUserId(userId);
    setDisplayName(displayName || getMxIdUsername(userId));
    setAvatarUrl(avatarUrl);
  }, []);

  const updateFromServer = useCallback(
    (session: Session) => {
      session.hsApi
        .profile(session.userId)
        .response()
        .then((data) => {
          if (!isMounted) return;
          updateProfile(session.userId, data.displayname, data.avatar_url);
        });
    },
    [isMounted, updateProfile]
  );

  useEffect(() => {
    if (session) {
      updateProfile(session.userId);
      updateFromServer(session);
    }
    return () => {
      updateProfile("@dummy:server.xyz");
    };
  }, [session, updateFromServer, updateProfile]);

  useEffect(() => {
    const unSubs = session?.observeRoomState({
      handleRoomState: (room, stateEvent) => {
        if (stateEvent.state_key !== session.userId) return;

        const { displayName, avatarUrl } = useStore.getState().userProfile;
        const { avatar_url: url, displayname: name } = stateEvent.content;
        if (avatarUrl === url && displayName === name) return;

        updateProfile(session.userId, name, url);
      },
      updateRoomMembers: () => {},
    });
    return () => {
      unSubs?.();
    };
  }, [session, updateProfile]);
}
