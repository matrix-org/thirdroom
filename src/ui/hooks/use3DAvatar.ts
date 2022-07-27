import { useCallback, useState } from "react";
import { Room, StateEvent } from "@thirdroom/hydrogen-view-sdk";

import { useStateEventKeyCallback } from "./useStateEventKeyCallback";

export function use3DAvatar(profileRoom: Room) {
  const [avatarUrl, setAvatarUrl] = useState();
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState();

  const callback = useCallback((stateEvent?: StateEvent) => {
    if (stateEvent) {
      const { content } = stateEvent;
      setAvatarUrl(content.avatar_url);
      setAvatarPreviewUrl(content.avatar_preview_url);
    } else {
      setAvatarUrl(undefined);
      setAvatarPreviewUrl(undefined);
    }
  }, []);

  useStateEventKeyCallback(profileRoom, "org.matrix.msc3815.world.profile", "", callback);

  return [avatarUrl, avatarPreviewUrl];
}
