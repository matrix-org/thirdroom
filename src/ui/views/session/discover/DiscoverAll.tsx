import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { DiscoverGroupGrid } from "../../components/discover-group/DiscoverGroup";
import { FeaturedRoomCard, FeaturedRoomsProvider, FeaturedWorldCard, FeaturedWorldsProvider } from "./DiscoverHome";
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
                    {featuredRooms.map(([stateKey, stateEvent]) => (
                      <FeaturedRoomCard session={session} platform={platform} roomId={stateKey} />
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
                      <FeaturedWorldCard session={session} platform={platform} roomId={stateKey} />
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
