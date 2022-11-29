import { Session, StateEvent } from "@thirdroom/hydrogen-view-sdk";
import { useState } from "react";

import { Button } from "../../../atoms/button/Button";
import { IconButton } from "../../../atoms/button/IconButton";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Modal } from "../../../atoms/modal/Modal";
import { Text } from "../../../atoms/text/Text";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { useStore } from "../../../hooks/useStore";
import { getHttpUrl } from "../../../utils/avatar";
import { FeaturedScene, FeaturedSceneContent } from "../../components/featured-scene/FeaturedScene";
import { CreateWorldModal } from "../create-world/CreateWorldModal";
import { RepositoryEvents } from "./DiscoverView";
import MoreHorizontalIC from "../../../../../res/ic/more-horizontal.svg";

interface FeaturedSceneCardProps {
  session: Session;
  roomId: string;
  stateKey: string;
  stateEvent: StateEvent;
  canEdit: boolean;
}

export function FeaturedSceneCard({ session, roomId, stateKey, stateEvent, canEdit }: FeaturedSceneCardProps) {
  const [create, setCreate] = useState(false);
  const content = stateEvent.content;

  const handleRemoveFeatured = () => {
    session.hsApi.sendState(roomId, RepositoryEvents.FeaturedScenes, stateKey, {});
  };

  const handleCreateWorld = (roomId: string) => {
    useStore.getState().overlayWorld.selectWorld(roomId);
    useStore.getState().overlayWindow.closeWindow();
    setCreate(false);
  };

  return (
    <FeaturedScene
      thumbnail={
        <Thumbnail size="lg" wide>
          <ThumbnailImg src={getHttpUrl(session, content.scene_preview_url) ?? ""} alt={content.scene_name} />
        </Thumbnail>
      }
    >
      <FeaturedSceneContent>
        <div className="grow">
          <Text className="truncate" variant="b3">
            {content.scene_author_name}
          </Text>
          <Text className="truncate">{content.scene_name}</Text>
        </div>
        <div className="flex items-center gap-xs">
          {canEdit && (
            <DropdownMenu
              content={
                <DropdownMenuItem onSelect={handleRemoveFeatured} variant="danger">
                  Remove Featured
                </DropdownMenuItem>
              }
            >
              <IconButton label="Options" iconSrc={MoreHorizontalIC} />
            </DropdownMenu>
          )}
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
      </FeaturedSceneContent>
    </FeaturedScene>
  );
}
