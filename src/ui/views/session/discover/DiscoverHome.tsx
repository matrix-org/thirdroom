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

interface DiscoverHomeProps {
  room: Room;
  onLoadEvents: (eventType: RepositoryEvents) => void;
  permissions: {
    canFeatureRooms: boolean;
    canFeatureWorlds: boolean;
    canFeatureScenes: boolean;
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
          <FeaturedScenesProvider room={room}>
            {(featuredScenes) =>
              featuredScenes.length === 0 ? null : (
                <DiscoverGroup
                  label={<Label>Featured Scenes</Label>}
                  content={
                    <DiscoverGroupGrid itemMinWidth={400} gap="md">
                      {featuredScenes.slice(0, 3).map(([stateKey, stateEvent]) => (
                        <FeaturedSceneCard
                          key={stateKey}
                          session={session}
                          roomId={room.id}
                          stateKey={stateKey}
                          stateEvent={stateEvent}
                          canEdit={permissions.canFeatureScenes}
                        />
                      ))}
                    </DiscoverGroupGrid>
                  }
                  footer={
                    featuredScenes.length > 3 && (
                      <div className="flex justify-end">
                        <DiscoverMoreButton
                          onClick={() => onLoadEvents(RepositoryEvents.FeaturedScenes)}
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
