import { useCallback, useEffect, useState } from "react";
import { Session, Client, SyncStatus, Room, RoomVisibility, RoomType } from "@thirdroom/hydrogen-view-sdk";

import { getMxIdUsername, getProfileRoom, waitToCreateRoom } from "../utils/matrixUtils";
import { useStore } from "./useStore";
import { useIsMounted } from "./useIsMounted";

export function useUserProfile(client: Client, session?: Session) {
  const { setUserId, setDisplayName, setAvatarUrl } = useStore((state) => state.userProfile);
  const isMounted = useIsMounted();
  const [profileRoom, setProfileRoom] = useState<Room>();

  const updateProfile = useCallback(
    (userId: string, displayName?: string, avatarUrl?: string) => {
      setUserId(userId);
      setDisplayName(displayName || getMxIdUsername(userId));
      setAvatarUrl(avatarUrl);
    },
    [setUserId, setDisplayName, setAvatarUrl]
  );

  const updateFromServer = useCallback(
    (session: Session) => {
      session.hsApi
        .profile(session.userId)
        .response()
        .then((data) => {
          if (!isMounted()) return;
          updateProfile(session.userId, data.displayname, data.avatar_url);
        })
        .catch(() => {
          // Silence error since not all users have profile routes
        });
    },
    [isMounted, updateProfile]
  );

  const listenProfileChange = useCallback(
    async (session: Session, profileRoom: Room) => {
      setProfileRoom(profileRoom);
      const memberObserver = await profileRoom.observeMember(session.userId);

      const unSubs = memberObserver?.subscribe((member) => {
        if (member.membership !== "join") unSubs?.();

        const { displayName, avatarUrl } = useStore.getState().userProfile;
        const { avatarUrl: url, displayName: name } = member;
        if (avatarUrl === url && displayName === name) return;

        updateProfile(session.userId, name, url);
      });
    },
    [updateProfile, setProfileRoom]
  );

  const initProfileRoom = useCallback(
    async (session: Session) => {
      const profileRoom = getProfileRoom(session.rooms);

      if (profileRoom) {
        listenProfileChange(session, profileRoom);
      } else {
        const roomBeingCreated = session.createRoom({
          type: RoomType.Profile,
          visibility: RoomVisibility.Private,
          name: "Third Room - Profile",
          topic: "This room contain profile information.",
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

        const profileRoom = await waitToCreateRoom(session, roomBeingCreated);
        if (!profileRoom) {
          window.setTimeout(() => window.location.reload());
          return;
        }
        listenProfileChange(session, profileRoom);
      }
    },
    [listenProfileChange]
  );

  useEffect(() => {
    let unSubs: () => void;
    const { sync } = client;
    if (!session) {
      setProfileRoom(undefined);
      return;
    }

    updateProfile(session.userId);
    updateFromServer(session);

    // Make sure catchup sync has completed
    // so we don't create redundant profile room.
    if (sync.status.get() === "Syncing" || getProfileRoom(session.rooms)) {
      initProfileRoom(session);
    } else {
      let prevStatus: SyncStatus = sync.status.get();
      unSubs = sync.status.subscribe((syncStatus) => {
        if (prevStatus === syncStatus) return;
        prevStatus = syncStatus;
        if (syncStatus === "Syncing") {
          initProfileRoom(session);
          unSubs?.();
        }
      });
    }
    return () => {
      unSubs?.();
      updateProfile("@dummy:server.xyz");
    };
  }, [client, session, updateProfile, updateFromServer, initProfileRoom]);

  return profileRoom;
}
