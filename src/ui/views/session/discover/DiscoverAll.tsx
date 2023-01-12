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
import { eventByOrderKey } from "../../../utils/matrixUtils";

export function DiscoverAll({ eventType, room }: { eventType: RepositoryEvents; room: Room }) {
  const { session, platform } = useHydrogen(true);

  return (
    <Scroll>
      <Content className="DiscoverAll__content">
        {eventType == RepositoryEvents.FeaturedRoom && (
          <DiscoverGroupGrid>
            <FeaturedRoomsProvider room={room}>
              {(featuredRooms) =>
                featuredRooms.length === 0 ? null : (
                  <>
                    {featuredRooms.sort(eventByOrderKey).map((stateEvent) => (
                      <FeaturedRoomCard
                        key={stateEvent.state_key}
                        session={session}
                        platform={platform}
                        roomId={stateEvent.state_key}
                      />
                    ))}
                  </>
                )
              }
            </FeaturedRoomsProvider>
          </DiscoverGroupGrid>
        )}
        {eventType == RepositoryEvents.FeaturedWorld && (
          <DiscoverGroupGrid>
            <FeaturedWorldsProvider room={room}>
              {(featuredWorlds) =>
                featuredWorlds.length === 0 ? null : (
                  <>
                    {featuredWorlds.sort(eventByOrderKey).map((stateEvent) => (
                      <FeaturedWorldCard
                        key={stateEvent.state_key}
                        session={session}
                        platform={platform}
                        roomId={stateEvent.state_key}
                      />
                    ))}
                  </>
                )
              }
            </FeaturedWorldsProvider>
          </DiscoverGroupGrid>
        )}
        {eventType === RepositoryEvents.FeaturedScene && (
          <DiscoverGroupGrid>
            <FeaturedScenesProvider room={room}>
              {(featuredScenes) =>
                featuredScenes.length === 0 ? null : (
                  <DiscoverGroupGrid itemMinWidth={300} gap="md">
                    {featuredScenes.sort(eventByOrderKey).map((stateEvent) => (
                      <FeaturedSceneCard
                        key={stateEvent.state_key}
                        session={session}
                        roomId={room.id}
                        stateEvent={stateEvent}
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
