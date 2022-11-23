import { Session } from "@thirdroom/hydrogen-view-sdk";

import { Text } from "../../../atoms/text/Text";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { getHttpUrl } from "../../../utils/avatar";
import { FeaturedScene, FeaturedSceneContent } from "../../components/featured-scene/FeaturedScene";
import { RoomEventProvider } from "../../components/RoomEventProvider";

interface FeaturedSceneCardProps {
  session: Session;
  roomId: string;
  eventId: string;
}

export function FeaturedSceneCard({ session, roomId, eventId }: FeaturedSceneCardProps) {
  return (
    <RoomEventProvider session={session} roomId={roomId} eventId={eventId} fallback={() => <p>loading</p>}>
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
            options={<></>}
          >
            <FeaturedSceneContent>
              <Text variant="b3">{event.content.scene_author_name}</Text>
              <Text>{event.content.scene_name}</Text>
            </FeaturedSceneContent>
          </FeaturedScene>
        )
      }
    </RoomEventProvider>
  );
}
