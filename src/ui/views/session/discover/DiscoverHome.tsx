import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Label } from "../../../atoms/text/Label";
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
import { RepositoryEvents } from "./DiscoverView";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { FeaturedWorldsProvider } from "../../components/FeaturedWorldssProvider";
import { FeaturedRoomsProvider } from "../../components/FeaturedRoomsProvider";
import { FeaturedRoomCard } from "./FeaturedRoomCard";
import { FeaturedWorldCard } from "./FeaturedWorldCard";

interface DiscoverHomeProps {
  room: Room;
  onLoadEvents: (eventType: RepositoryEvents) => void;
  permissions: {
    canFeatureRooms: boolean;
    canFeatureWorlds: boolean;
  };
}
export function DiscoverHome({ room, onLoadEvents, permissions }: DiscoverHomeProps) {
  const { session, platform } = useHydrogen(true);

  return (
    <Scroll>
      <Content className="DiscoverHome__content">
        <div className="flex flex-column gap-md">
          <FeaturedRoomsProvider room={room}>
            {(featuredRooms) =>
              featuredRooms.length === 0 ? null : (
                <DiscoverGroup
                  label={<Label>Featured Public Rooms</Label>}
                  content={
                    <DiscoverGroupGrid>
                      {featuredRooms.slice(0, 4).map(([stateKey, stateEvent]) => (
                        <FeaturedRoomCard
                          key={stateKey}
                          session={session}
                          platform={platform}
                          repoRoomId={room.id}
                          roomId={stateKey}
                          canEdit={permissions.canFeatureRooms}
                        />
                      ))}
                    </DiscoverGroupGrid>
                  }
                  footer={
                    featuredRooms.length > 4 && (
                      <div className="flex justify-end">
                        <DiscoverMoreButton
                          onClick={() => onLoadEvents(RepositoryEvents.FeaturedRooms)}
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
                      {featuredWorlds.slice(0, 4).map(([stateKey, stateEvent]) => (
                        <FeaturedWorldCard
                          key={stateKey}
                          session={session}
                          platform={platform}
                          repoRoomId={room.id}
                          roomId={stateKey}
                          canEdit={permissions.canFeatureWorlds}
                        />
                      ))}
                    </DiscoverGroupGrid>
                  }
                  footer={
                    featuredWorlds.length > 4 && (
                      <div className="flex justify-end">
                        <DiscoverMoreButton
                          onClick={() => onLoadEvents(RepositoryEvents.FeaturedWorlds)}
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
        </div>
      </Content>
    </Scroll>
  );
}
