import { useState } from "react";
import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Content } from "../../../atoms/content/Content";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import ExploreIC from "../../../../../res/ic/explore.svg";
import ChevronRightIC from "../../../../../res/ic/chevron-right.svg";
import { Icon } from "../../../atoms/icon/Icon";
import { Window } from "../../components/window/Window";
import { DiscoverHome } from "./DiscoverHome";
import { SegmentControl } from "../../../atoms/segment-control/SegmentControl";
import { SegmentControlItem } from "../../../atoms/segment-control/SegmentControlItem";
import { usePowerLevels } from "../../../hooks/usePowerLevels";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { DiscoverAdmin } from "./DiscoverAdmin";
import { DiscoverAll } from "./DiscoverAll";

export enum RepositoryEvents {
  FeaturedWorlds = "tr.repository_room.featured_worlds",
  FeaturedRooms = "tr.repository_room.featured_rooms",
  FeaturedScenes = "tr.repository_room.featured_scenes",
}

enum DiscoverTab {
  Home = "Home",
  Admin = "Admin",
}

export function DiscoverView({ room }: { room: Room }) {
  const { session } = useHydrogen(true);
  const { getPowerLevel } = usePowerLevels(room);
  const [discoverTab, setDiscoverTab] = useState<DiscoverTab>(DiscoverTab.Home);
  const [loadEvents, setLoadEvents] = useState<RepositoryEvents>();

  // TODO: use proper state event permission to find edit permission.
  const isAdmin = getPowerLevel(session.userId) >= 50;
  if (!isAdmin && discoverTab === DiscoverTab.Admin) {
    setDiscoverTab(DiscoverTab.Home);
  }

  return (
    <Window>
      <Content
        top={
          <Header
            left={
              <div className="flex items-center gap-xxs">
                <button style={{ cursor: "pointer" }} onClick={() => setLoadEvents(undefined)}>
                  <HeaderTitle icon={<Icon color="surface" className="shrink-0" src={ExploreIC} />}>
                    Discover
                  </HeaderTitle>
                </button>
                {loadEvents ? (
                  <>
                    <Icon src={ChevronRightIC} />
                    <HeaderTitle>{`All Public ${(() => {
                      if (loadEvents === RepositoryEvents.FeaturedRooms) return "Rooms";
                      if (loadEvents === RepositoryEvents.FeaturedWorlds) return "Worlds";
                      if (loadEvents === RepositoryEvents.FeaturedScenes) return "Scenes";
                    })()}`}</HeaderTitle>
                  </>
                ) : null}
              </div>
            }
            center={
              loadEvents ? null : (
                <SegmentControl>
                  <SegmentControlItem
                    value={DiscoverTab.Home}
                    isSelected={DiscoverTab.Home === discoverTab}
                    onSelect={setDiscoverTab}
                  >
                    Home
                  </SegmentControlItem>
                  {isAdmin && (
                    <SegmentControlItem
                      value={DiscoverTab.Admin}
                      isSelected={DiscoverTab.Admin === discoverTab}
                      onSelect={setDiscoverTab}
                    >
                      Admin
                    </SegmentControlItem>
                  )}
                </SegmentControl>
              )
            }
          />
        }
      >
        {loadEvents ? (
          <DiscoverAll eventType={loadEvents} room={room} />
        ) : (
          <>
            {discoverTab === DiscoverTab.Home && room && <DiscoverHome room={room} onLoadEvents={setLoadEvents} />}
            {discoverTab === DiscoverTab.Admin && room && <DiscoverAdmin room={room} />}
          </>
        )}
      </Content>
    </Window>
  );
}
