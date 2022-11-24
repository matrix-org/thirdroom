import { Session } from "@thirdroom/hydrogen-view-sdk";
import { useState } from "react";

import { Button } from "../../../atoms/button/Button";
import { Modal } from "../../../atoms/modal/Modal";
import { Text } from "../../../atoms/text/Text";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { useStore } from "../../../hooks/useStore";
import { getHttpUrl } from "../../../utils/avatar";
import { FeaturedScene, FeaturedSceneContent } from "../../components/featured-scene/FeaturedScene";
import { RoomEventProvider } from "../../components/RoomEventProvider";
import { CreateWorldModal } from "../create-world/CreateWorldModal";

interface FeaturedSceneCardProps {
  session: Session;
  roomId: string;
  eventId: string;
}

export function FeaturedSceneCard({ session, roomId, eventId }: FeaturedSceneCardProps) {
  const [create, setCreate] = useState(false);

  const handleCreateWorld = (roomId: string) => {
    useStore.getState().overlayWorld.selectWorld(roomId);
    useStore.getState().overlayWindow.closeWindow();
    setCreate(false);
  };

  return (
    <RoomEventProvider
      session={session}
      roomId={roomId}
      eventId={eventId}
      fallback={() => <Thumbnail size="lg" wide />}
    >
      {(event) =>
        typeof event.content.scene_url !== "string" ? null : (
          <FeaturedScene
            key={event.event_id}
            thumbnail={
              <Thumbnail size="lg" wide>
                <ThumbnailImg
                  src={getHttpUrl(session, event.content.scene_preview_url) ?? ""}
                  alt={event.content.scene_name}
                />
              </Thumbnail>
            }
          >
            <FeaturedSceneContent>
              <div className="grow">
                <Text className="truncate" variant="b3">
                  {event.content.scene_author_name}
                </Text>
                <Text className="truncate">{event.content.scene_name}</Text>
              </div>
              <div className="flex items-center gap-xxs">
                <Modal open={create} onOpenChange={setCreate}>
                  <CreateWorldModal
                    session={session}
                    sceneEvent={event}
                    onClose={() => setCreate(false)}
                    onCreate={handleCreateWorld}
                  />
                </Modal>
                <Button onClick={() => setCreate(true)} variant="secondary">
                  Create World
                </Button>
              </div>
            </FeaturedSceneContent>
          </FeaturedScene>
        )
      }
    </RoomEventProvider>
  );
}
