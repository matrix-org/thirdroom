import { Room, Session } from "@thirdroom/hydrogen-view-sdk";

import { RepositoryEvents } from "../views/session/discover/DiscoverView";
import { usePowerLevels } from "./usePowerLevels";

export function useUpdateScene(session: Session, room: Room) {
  const { getPowerLevel, canSendStateEvent } = usePowerLevels(room);

  const checkForUpdate = async (): Promise<boolean> => {
    const canUpdateScene = canSendStateEvent("org.matrix.msc3815.world", getPowerLevel(session.userId));
    if (!canUpdateScene) return false;

    try {
      const stateEvent = await room?.getStateEvent("org.matrix.msc3815.world");
      const content = stateEvent?.event?.content;
      if (!content) return false;
      const sceneStateKey = content.scene_from?.state_key;
      const sceneRoomId = content.scene_from?.room_id;
      const sceneVersion = content.scene?.version ?? 1;

      if (sceneStateKey && sceneRoomId) {
        const sceneContent = await session.hsApi
          .state(sceneRoomId, RepositoryEvents.FeaturedScene, sceneStateKey)
          .response();

        const updateVersion = sceneContent?.scene.version;
        if (typeof updateVersion === "number" && updateVersion > sceneVersion) {
          return true;
        }
      }
    } catch (err) {
      console.warn(err);
    }
    return false;
  };

  const updateScene = async () => {
    const stateEvent = await room?.getStateEvent("org.matrix.msc3815.world");
    const content = stateEvent?.event?.content;
    if (!content) return false;
    const sceneStateKey = content.scene_from?.state_key;
    const sceneRoomId = content.scene_from?.room_id;

    if (sceneStateKey && sceneRoomId) {
      const sceneContent = await session.hsApi
        .state(sceneRoomId, RepositoryEvents.FeaturedScene, sceneStateKey)
        .response();

      await session.hsApi.sendState(room.id, "org.matrix.msc3815.world", "", {
        ...(stateEvent?.event?.content ?? {}),
        scene_url: sceneContent.scene.url,
        scene_preview_url: sceneContent.scene.preview_url,
        scene: sceneContent.scene,
        from: sceneContent.scene.from,
      });
    }
  };

  return {
    checkForUpdate,
    updateScene,
  };
}
