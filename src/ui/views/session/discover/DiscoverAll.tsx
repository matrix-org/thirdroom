import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { DiscoverGroupGrid } from "../../components/discover-group/DiscoverGroup";
import { RepositoryEvents } from "./DiscoverView";
import "./DiscoverAll.css";
import { FeaturedRoomsProvider } from "../../components/FeaturedRoomsProvider";
import { FeaturedWorldsProvider } from "../../components/FeaturedWorldsProvider";
import { FeaturedRoomCard } from "./FeaturedRoomCard";
import { FeaturedWorldCard } from "./FeaturedWorldCard";
import { FeaturedScenesProvider } from "../../components/FeaturedScenesProvider";
import { FeaturedSceneCard } from "./FeaturedSceneCard";

export function DiscoverAll({
  eventType,
  room,
  permissions,
}: {
  eventType: RepositoryEvents;
  room: Room;
  permissions: {
    canFeatureRooms: boolean;
    canFeatureWorlds: boolean;
    canFeatureScenes: boolean;
  };
}) {
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
                    {featuredRooms.map(([stateKey, stateEvent]) => (
                      <FeaturedRoomCard
                        key={stateKey}
                        session={session}
                        platform={platform}
                        repoRoomId={room.id}
                        roomId={stateKey}
                        canEdit={permissions.canFeatureRooms}
                      />
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
                    {featuredWorlds.map(([stateKey, stateEvent]) => (
                      <FeaturedWorldCard
                        key={stateKey}
                        session={session}
                        platform={platform}
                        repoRoomId={room.id}
                        roomId={stateKey}
                        canEdit={permissions.canFeatureWorlds}
                      />
                    ))}
                  </>
                )
              }
            </FeaturedWorldsProvider>
          </DiscoverGroupGrid>
        )}
        {eventType === RepositoryEvents.FeaturedScenes && (
          <DiscoverGroupGrid>
            <FeaturedScenesProvider room={room}>
              {(featuredScenes) =>
                featuredScenes.length === 0 ? null : (
                  <DiscoverGroupGrid itemMinWidth={300} gap="md">
                    {featuredScenes.map(([stateKey, stateEvent]) => (
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
                )
              }
            </FeaturedScenesProvider>
          </DiscoverGroupGrid>
        )}
      </Content>
    </Scroll>
  );
}
