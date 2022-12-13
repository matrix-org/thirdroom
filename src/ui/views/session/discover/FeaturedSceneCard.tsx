import { Session, StateEvent } from "@thirdroom/hydrogen-view-sdk";
import { useState } from "react";

import { Button } from "../../../atoms/button/Button";
import { Modal } from "../../../atoms/modal/Modal";
import { Text } from "../../../atoms/text/Text";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { useStore } from "../../../hooks/useStore";
import { getHttpUrl } from "../../../utils/avatar";
import { ScenePreviewCard, ScenePreviewCardContent } from "../../components/scene-preview-card/ScenePreviewCard";
import { CreateWorldModal } from "../create-world/CreateWorldModal";

interface FeaturedSceneCardProps {
  session: Session;
  roomId: string;
  stateEvent: StateEvent;
}

export function FeaturedSceneCard({ session, roomId, stateEvent }: FeaturedSceneCardProps) {
  const [create, setCreate] = useState(false);
  const content = stateEvent.content;

  const handleCreateWorld = (roomId: string) => {
    useStore.getState().overlayWorld.selectWorld(roomId);
    useStore.getState().overlayWindow.closeWindow();
    setCreate(false);
  };

  return (
    <ScenePreviewCard
      thumbnail={
        <Thumbnail size="lg" wide>
          <ThumbnailImg src={getHttpUrl(session, content.scene.preview_url) ?? ""} alt={content.scene.name} />
        </Thumbnail>
      }
    >
      <ScenePreviewCardContent>
        <div className="grow">
          <Text className="truncate" variant="b3">
            {content.scene.author_name}
          </Text>
          <Text className="truncate">{content.scene.name}</Text>
        </div>
        <div className="flex items-center gap-xs">
          <Modal open={create} onOpenChange={setCreate}>
            <CreateWorldModal
              session={session}
              scene={{
                roomId,
                event: stateEvent,
              }}
              onClose={() => setCreate(false)}
              onCreate={handleCreateWorld}
            />
          </Modal>
          <Button onClick={() => setCreate(true)} variant="secondary">
            Create World
          </Button>
        </div>
      </ScenePreviewCardContent>
    </ScenePreviewCard>
  );
}
