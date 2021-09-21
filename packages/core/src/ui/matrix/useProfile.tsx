import { useCallback, useContext, useEffect, useState, useMemo } from "react";
import { ClientContext } from "./ClientContext";

const PROFILE_KEY = "thirdroom_profile";

interface Profile {
  avatarMxcUrl?: string
}

export function useProfile() {
  const { client } = useContext(ClientContext);

  const [profile , setProfile] = useState<Profile>(() => {
    const profileStr = localStorage.getItem(PROFILE_KEY);

    if (!profileStr) {
      return {};
    }

    try {
      return JSON.parse(profileStr);
    } catch (error) {
      console.error("Error parsing profile data");
      return {};
    }
  });

  const uploadAndChangeAvatar = useCallback(async (avatar: File | Blob): Promise<string | null> => {
    if (!client) {
      throw new Error("Client is not initialized");
    }

    const newMxcAvatarUrl = await client.uploadContent(avatar);

    setProfile((prevProfile) => ({ ...prevProfile, avatarMxcUrl: newMxcAvatarUrl }));

    return client.mxcUrlToHttp(newMxcAvatarUrl);
  }, [client]);

  const avatarUrl = useMemo(() => {
    if (!client) {
      return null;
    }

    if (profile.avatarMxcUrl) {
      return client.mxcUrlToHttp(profile.avatarMxcUrl);
    }

    return null;
  } , [profile.avatarMxcUrl]);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  return { avatarUrl, ...profile, uploadAndChangeAvatar };
}