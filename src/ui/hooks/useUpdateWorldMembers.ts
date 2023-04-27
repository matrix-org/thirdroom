import { Room } from "@thirdroom/hydrogen-view-sdk";
import { useEffect } from "react";

import { Thread } from "../../engine/module/module.common";
import { ThirdRoomMessageType, UpdateWorldMembersMessage, WorldMember } from "../../plugins/thirdroom/thirdroom.common";
import { useMainThreadContext } from "./useMainThread";
import { useStateEvents } from "./useStateEvents";

export function useUpdateWorldMembers(world?: Room) {
  const worldMembersEvents = useStateEvents(world, "org.matrix.msc3815.world.member");
  const mainThread = useMainThreadContext();

  useEffect(() => {
    const worldMembers: Map<string, WorldMember> = new Map(
      Array.from(worldMembersEvents).map(([userId, event]) => [userId, { avatarUrl: event.content.avatar_url }])
    );

    mainThread.sendMessage<UpdateWorldMembersMessage>(Thread.Game, {
      type: ThirdRoomMessageType.UpdateWorldMembers,
      worldMembers,
    });
  }, [mainThread, worldMembersEvents]);
}
