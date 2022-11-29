import { Room, Session } from "@thirdroom/hydrogen-view-sdk";

import { RepositoryEvents } from "../views/session/discover/DiscoverView";
import { usePowerLevels } from "./usePowerLevels";

export function useSceneUpdate(session: Session, room: Room) {
  const { getPowerLevel, canSendStateEvent } = usePowerLevels(room);
  const canUpdateScene = canSendStateEvent("org.matrix.msc3815.world", getPowerLevel(session.userId));

  const getUpdate = async (): Promise<Record<string, any> | undefined> => {
    try {
      const stateEvent = await room?.getStateEvent("org.matrix.msc3815.world");
      const {
        scene_state_key: sceneStateKey,
        scene_room_id: sceneRoomId,
        scene_version: sceneVersion,
      } = stateEvent?.event?.content ?? {};

      if (sceneStateKey && sceneRoomId && typeof sceneVersion === "number") {
        const sceneContent = await session.hsApi
          .state(sceneRoomId, RepositoryEvents.FeaturedScenes, sceneStateKey)
          .response();

        const updateVersion = sceneContent?.scene_version;
        if (typeof updateVersion === "number" && updateVersion > sceneVersion) {
          return sceneContent;
        }
      }
    } catch (err) {
      console.warn(err);
    }
    return undefined;
  };

  const updateScene = async (content: Record<string, any>) => {
    const stateEvent = await room?.getStateEvent("org.matrix.msc3815.world");

    await session.hsApi.sendState(room.id, "org.matrix.msc3815.world", "", {
      ...(stateEvent?.event?.content ?? {}),
      ...content,
    });
  };

  return {
    canUpdateScene,
    getUpdate,
    updateScene,
  };
}
