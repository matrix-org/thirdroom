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
                    {featuredRooms.map(([stateKey, stateEvent]) => (
                      <FeaturedRoomCard key={stateKey} session={session} platform={platform} roomId={stateKey} />
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
                      <FeaturedWorldCard key={stateKey} session={session} platform={platform} roomId={stateKey} />
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
                      <FeaturedSceneCard key={stateKey} session={session} roomId={room.id} stateEvent={stateEvent} />
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
