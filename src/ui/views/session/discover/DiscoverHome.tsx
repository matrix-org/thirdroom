import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Label } from "../../../atoms/text/Label";
import ArrowForwardIC from "../../../../../res/ic/arrow-forward.svg";
import "./DiscoverHome.css";
import { DiscoverGroup, DiscoverGroupGrid, DiscoverMoreButton } from "../../components/discover-group/DiscoverGroup";
import { RepositoryEvents } from "./DiscoverView";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { FeaturedWorldsProvider } from "../../components/FeaturedWorldsProvider";
import { FeaturedRoomsProvider } from "../../components/FeaturedRoomsProvider";
import { FeaturedRoomCard } from "./FeaturedRoomCard";
import { FeaturedWorldCard } from "./FeaturedWorldCard";
import { FeaturedScenesProvider } from "../../components/FeaturedScenesProvider";
import { FeaturedSceneCard } from "./FeaturedSceneCard";
import { eventByOrderKey } from "../../../utils/matrixUtils";

interface DiscoverHomeProps {
  room: Room;
  supportRoomSummary: boolean;
  onLoadEvent: (eventType: RepositoryEvents) => void;
}
export function DiscoverHome({ room, supportRoomSummary, onLoadEvent }: DiscoverHomeProps) {
  const { session, platform } = useHydrogen(true);

  return (
    <Scroll>
      <Content className="DiscoverHome__content">
        <div className="flex flex-column gap-md">
          {supportRoomSummary && (
            <>
              <FeaturedRoomsProvider room={room}>
                {(featuredRooms) =>
                  featuredRooms.length === 0 ? null : (
                    <DiscoverGroup
                      label={<Label>Featured Public Rooms</Label>}
                      content={
                        <DiscoverGroupGrid>
                          {featuredRooms
                            .sort(eventByOrderKey)
                            .slice(0, 4)
                            .map((stateEvent) => (
                              <FeaturedRoomCard
                                key={stateEvent.state_key}
                                session={session}
                                platform={platform}
                                roomId={stateEvent.state_key}
                              />
                            ))}
                        </DiscoverGroupGrid>
                      }
                      footer={
                        featuredRooms.length > 4 && (
                          <div className="flex justify-end">
                            <DiscoverMoreButton
                              onClick={() => onLoadEvent(RepositoryEvents.FeaturedRoom)}
                              text="Browse All Public Rooms"
                              iconSrc={ArrowForwardIC}
                            />
                          </div>
                        )
                      }
                    />
                  )
                }
              </FeaturedRoomsProvider>
              <FeaturedWorldsProvider room={room}>
                {(featuredWorlds) =>
                  featuredWorlds.length === 0 ? null : (
                    <DiscoverGroup
                      label={<Label>Featured Public Worlds</Label>}
                      content={
                        <DiscoverGroupGrid>
                          {featuredWorlds
                            .sort(eventByOrderKey)
                            .slice(0, 4)
                            .map((stateEvent) => (
                              <FeaturedWorldCard
                                key={stateEvent.state_key}
                                session={session}
                                platform={platform}
                                roomId={stateEvent.state_key}
                              />
                            ))}
                        </DiscoverGroupGrid>
                      }
                      footer={
                        featuredWorlds.length > 4 && (
                          <div className="flex justify-end">
                            <DiscoverMoreButton
                              onClick={() => onLoadEvent(RepositoryEvents.FeaturedWorld)}
                              text="Browse All Public Worlds"
                              iconSrc={ArrowForwardIC}
                            />
                          </div>
                        )
                      }
                    />
                  )
                }
              </FeaturedWorldsProvider>
            </>
          )}
          <FeaturedScenesProvider room={room}>
            {(featuredScenes) =>
              featuredScenes.length === 0 ? null : (
                <DiscoverGroup
                  label={<Label>Featured Scenes</Label>}
                  content={
                    <DiscoverGroupGrid itemMinWidth={400} gap="md">
                      {featuredScenes
                        .sort(eventByOrderKey)
                        .slice(0, 3)
                        .map((stateEvent) => (
                          <FeaturedSceneCard
                            key={stateEvent.state_key}
                            session={session}
                            roomId={room.id}
                            stateEvent={stateEvent}
                          />
                        ))}
                    </DiscoverGroupGrid>
                  }
                  footer={
                    featuredScenes.length > 3 && (
                      <div className="flex justify-end">
                        <DiscoverMoreButton
                          onClick={() => onLoadEvent(RepositoryEvents.FeaturedScene)}
                          text="Browse All Scenes"
                          iconSrc={ArrowForwardIC}
                        />
                      </div>
                    )
                  }
                />
              )
            }
          </FeaturedScenesProvider>
        </div>
      </Content>
    </Scroll>
  );
}
