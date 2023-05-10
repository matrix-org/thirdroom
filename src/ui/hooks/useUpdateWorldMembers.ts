import { Room } from "@thirdroom/hydrogen-view-sdk";
import { useEffect } from "react";

import { Thread } from "../../engine/module/module.common";
import { ThirdRoomMessageType, UpdateWorldMembersMessage, WorldMember } from "../../plugins/thirdroom/thirdroom.common";
import { useHydrogen } from "./useHydrogen";
import { useMainThreadContext } from "./useMainThread";
import { useStateEvents } from "./useStateEvents";

export function useUpdateWorldMembers(world?: Room) {
  const { session } = useHydrogen(true);
  const worldMembersEvents = useStateEvents(world, "org.matrix.msc3815.world.member");
  const mainThread = useMainThreadContext();

  useEffect(() => {
    const worldMembers: Map<string, WorldMember> = new Map(
      Array.from(worldMembersEvents).map(([userId, event]) => {
        const avatarMxcUrl = event.content.avatar_url;
        const avatarUrl = avatarMxcUrl ? session.mediaRepository.mxcUrl(avatarMxcUrl) : undefined;
        return [userId, { avatarUrl }];
      })
    );

    mainThread.sendMessage<UpdateWorldMembersMessage>(Thread.Game, {
      type: ThirdRoomMessageType.UpdateWorldMembers,
      worldMembers,
    });
  }, [mainThread, worldMembersEvents, session]);
}
