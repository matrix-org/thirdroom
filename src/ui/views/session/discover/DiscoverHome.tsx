import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { Button } from "../../../atoms/button/Button";
import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Label } from "../../../atoms/text/Label";
import { RoomPreviewCard } from "../../components/room-preview-card/RoomPreviewCard";
import ArrowForwardIC from "../../../../../res/ic/arrow-forward.svg";
import "./DiscoverHome.css";
import { DiscoverGroup, DiscoverGroupGrid, DiscoverMoreButton } from "../../components/discover-group/DiscoverGroup";
import LogoSvg from "../../../../../res/svg/logo.svg";
import {
  FeaturedScene,
  FeaturedSceneContent,
  FeaturedSceneThumbnail,
} from "../../components/featured-scene/FeaturedScene";
import { Text } from "../../../atoms/text/Text";
import { useStateEvents } from "../../../hooks/useStateEvents";
import { RepositoryEvents } from "./DiscoverView";
import { RoomSummaryProvider } from "../../components/RoomSummaryProvider";
import { getAvatarHttpUrl } from "../../../utils/avatar";
import { useHydrogen } from "../../../hooks/useHydrogen";

export function DiscoverHome({ room }: { room: Room }) {
  const { session, platform } = useHydrogen(true);
  const featuredRooms = useStateEvents(room, RepositoryEvents.FeaturedRooms);
  const featuredWorlds = useStateEvents(room, RepositoryEvents.FeaturedWorlds);
  // const FeaturedScenes = useStateEvents(room, RepositoryEvents.FeaturedScenes);

  return (
    <Scroll>
      <Content className="DiscoverHome__content">
        {featuredRooms.size === 0 ? null : (
          <DiscoverGroup
            label={<Label>Featured Public Rooms</Label>}
            content={
              <DiscoverGroupGrid>
                {[...featuredRooms].map(([eventId, stateEvent]) => (
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
                            bgColor="blue"
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
              </DiscoverGroupGrid>
            }
            footer={
              <div className="flex justify-end">
                <DiscoverMoreButton text="Browse All Public Rooms" iconSrc={ArrowForwardIC} />
              </div>
            }
          />
        )}
        {featuredWorlds.size === 0 ? null : (
          <DiscoverGroup
            label={<Label>Featured Public Worlds</Label>}
            content={
              <DiscoverGroupGrid>
                {[...featuredWorlds].map(([eventId, stateEvent]) => (
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
                            bgColor="blue"
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
              </DiscoverGroupGrid>
            }
            footer={
              <div className="flex justify-end">
                <DiscoverMoreButton text="Browse All Public Worlds" iconSrc={ArrowForwardIC} />
              </div>
            }
          />
        )}
        <DiscoverGroup
          label={<Label>Featured Scenes</Label>}
          content={
            <DiscoverGroupGrid itemMinWidth={300} gap="md">
              <FeaturedScene onClick={() => false}>
                <FeaturedSceneThumbnail src={LogoSvg} alt="scene" />
                <FeaturedSceneContent>
                  <Text variant="b3">Rad Designs</Text>
                  <Text>Zombie city</Text>
                </FeaturedSceneContent>
              </FeaturedScene>
            </DiscoverGroupGrid>
          }
          footer={
            <div className="flex justify-end">
              <DiscoverMoreButton text="Browse All Scenes" iconSrc={ArrowForwardIC} />
            </div>
          }
        />
      </Content>
    </Scroll>
  );
}
