import { useEffect } from "react";
import { Session, Client } from "@thirdroom/hydrogen-view-sdk";
import { useSetAtom } from "jotai";

import { getMxIdUsername, getUserProfile } from "../utils/matrixUtils";
import { useIsMounted } from "./useIsMounted";
import { userProfileAtom } from "../state/userProfile";

export function useUserProfile(client: Client, session?: Session) {
  const setUserProfile = useSetAtom(userProfileAtom);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (!session) {
      return;
    }

    setUserProfile({
      userId: session.userId,
      displayName: getMxIdUsername(session.userId),
    });

    Promise.all([session.hsApi.profile(session.userId).response(), getUserProfile(session)])
      .then(([profileData, userProfile]) => {
        if (!isMounted()) return;

        setUserProfile({
          userId: session.userId,
          displayName: profileData.displayname || getMxIdUsername(session.userId),
          avatarUrl: profileData.avatar_url,
          avatarModelUrl: userProfile?.avatar_url,
          avatarModelPreviewUrl: userProfile?.avatar_preview_url,
        });
      })
      .catch(() => {
        // Silence error since not all users have profile routes
      });

    return () => {
      setUserProfile({
        userId: "@dummy:server.xyz",
        displayName: getMxIdUsername("@dummy:server.xyz"),
      });
    };
  }, [client, session, setUserProfile, isMounted]);
}
