import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { Button } from "../../../atoms/button/Button";
import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { DiscoverGroupGrid } from "../../components/discover-group/DiscoverGroup";
import { RoomPreviewCard } from "../../components/room-preview-card/RoomPreviewCard";
import { RoomSummaryProvider } from "../../components/RoomSummaryProvider";
import { FeaturedRoomsProvider, FeaturedWorldsProvider } from "./DiscoverHome";
import { RepositoryEvents } from "./DiscoverView";
import "./DiscoverAll.css";

export function DiscoverAll({ eventType, room }: { eventType: RepositoryEvents; room: Room }) {
  const { session, platform } = useHydrogen(true);

  return (
    <Scroll>
      <Content className="DiscoverAll__content">
        {eventType == RepositoryEvents.FeaturedRooms && (
          <DiscoverGroupGrid>
            <FeaturedRoomsProvider room={room}>
              {(featuredRooms) =>
                featuredRooms.length === 0 ? null : (
                  <>
                    {featuredRooms.map(([eventId, stateEvent]) => (
                      <RoomSummaryProvider key={eventId} roomIdOrAlias={eventId} fallback={() => <RoomPreviewCard />}>
                        {(summaryData) => (
                          <RoomPreviewCard
                            avatar={
                              <Avatar
                                imageSrc={
                                  summaryData.avatarUrl &&
                                  getAvatarHttpUrl(summaryData.avatarUrl, 60, platform, session.mediaRepository)
                                }
                                shape="rounded"
                                size="lg"
                                bgColor={`var(--usercolor${getIdentifierColorNumber(summaryData.roomId)})`}
                                name={summaryData.name}
                              />
                            }
                            name={summaryData.name}
                            desc={summaryData.topic}
                            memberCount={summaryData.memberCount}
                            options={
                              <Button variant="secondary" size="sm" onClick={() => console.log("clicked")}>
                                Join
                              </Button>
                            }
                          />
                        )}
                      </RoomSummaryProvider>
                    ))}
                  </>
                )
              }
            </FeaturedRoomsProvider>
          </DiscoverGroupGrid>
        )}
        {eventType == RepositoryEvents.FeaturedWorlds && (
          <DiscoverGroupGrid>
            <FeaturedWorldsProvider room={room}>
              {(featuredWorlds) =>
                featuredWorlds.length === 0 ? null : (
                  <>
                    {featuredWorlds.map(([eventId, stateEvent]) => (
                      <RoomSummaryProvider key={eventId} roomIdOrAlias={eventId} fallback={() => <RoomPreviewCard />}>
                        {(summaryData) => (
                          <RoomPreviewCard
                            avatar={
                              <Avatar
                                imageSrc={
                                  summaryData.avatarUrl &&
                                  getAvatarHttpUrl(summaryData.avatarUrl, 60, platform, session.mediaRepository)
                                }
                                shape="circle"
                                size="lg"
                                bgColor={`var(--usercolor${getIdentifierColorNumber(summaryData.roomId)})`}
                                name={summaryData.name}
                              />
                            }
                            name={summaryData.name}
                            desc={summaryData.topic}
                            memberCount={summaryData.memberCount}
                            options={
                              <Button variant="secondary" size="sm" onClick={() => console.log("clicked")}>
                                Join
                              </Button>
                            }
                          />
                        )}
                      </RoomSummaryProvider>
                    ))}
                  </>
                )
              }
            </FeaturedWorldsProvider>
          </DiscoverGroupGrid>
        )}
      </Content>
    </Scroll>
  );
}
