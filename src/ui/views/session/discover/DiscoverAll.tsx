import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { DiscoverGroupGrid } from "../../components/discover-group/DiscoverGroup";
import { RepositoryEvents } from "./DiscoverView";
import "./DiscoverAll.css";
import { FeaturedRoomsProvider } from "../../components/FeaturedRoomsProvider";
import { FeaturedWorldsProvider } from "../../components/FeaturedWorldssProvider";
import { FeaturedRoomCard } from "./FeaturedRoomCard";
import { FeaturedWorldCard } from "./FeaturedWorldCard";

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
      </Content>
    </Scroll>
  );
}
