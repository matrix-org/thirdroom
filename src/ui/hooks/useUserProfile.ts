import { useCallback, useEffect } from "react";
import { Session, Client, SyncStatus, Room, RoomVisibility, RoomType } from "@thirdroom/hydrogen-view-sdk";

import { getMxIdUsername, getProfileRoom } from "../utils/matrixUtils";
import { useStore } from "./useStore";
import { useIsMounted } from "./useIsMounted";

export function useUserProfile(client: Client, session: Session) {
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

  const listenProfileChange = useCallback(
    async (profileRoom: Room) => {
      const memberObserver = await profileRoom.observeMember(session.userId);

      const unSubs = memberObserver?.subscribe((member) => {
        if (member.membership !== "join") unSubs?.();

        const { displayName, avatarUrl } = useStore.getState().userProfile;
        const { avatarUrl: url, displayName: name } = member;
        if (avatarUrl === url && displayName === name) return;

        updateProfile(session.userId, name, url);
      });
    },
    [session, updateProfile]
  );

  const initProfileRoom = useCallback(() => {
    const profileRoom = getProfileRoom(session.rooms);

    if (profileRoom) {
      listenProfileChange(profileRoom);
    } else {
      const roomBeingCreated = session.createRoom({
        type: RoomType.Profile,
        visibility: RoomVisibility.Private,
        name: "Profile Room",
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
          users: {
            [session.userId]: 100,
          },
        },
      });

      const unSubs = roomBeingCreated.disposableOn("change", () => {
        if (!roomBeingCreated.roomId) return;
        const profileRoom = session.rooms.get(roomBeingCreated.roomId);
        if (!profileRoom) return;
        unSubs();
        listenProfileChange(profileRoom);
      });
    }
  }, [session, listenProfileChange]);

  useEffect(() => {
    let unSubs: () => void;
    const { sync } = client;

    updateProfile(session.userId);
    updateFromServer(session);

    // Make sure catchup sync has completed
    // so we don't create redundant profile room.
    if (sync.status.get() === "Syncing") {
      initProfileRoom();
    } else {
      let prevStatus: SyncStatus = sync.status.get();
      unSubs = sync.status.subscribe((syncStatus) => {
        if (prevStatus === syncStatus) return;
        prevStatus = syncStatus;
        if (syncStatus === "Syncing") {
          initProfileRoom();
          unSubs?.();
        }
      });
    }
    return () => {
      unSubs?.();
      updateProfile("@dummy:server.xyz");
    };
  }, [client, session, updateProfile, updateFromServer, initProfileRoom]);
}
