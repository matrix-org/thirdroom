import { useEffect, useState } from "react";
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
import { DiscoverCreator } from "./DiscoverCreator";
import { getRoomSummary } from "../../../hooks/useRoomSummary";
import "./DiscoverView.css";

export enum RepositoryEvents {
  FeaturedWorld = "msc3948.repository_room.featured_world",
  FeaturedRoom = "msc3948.repository_room.featured_room",
  FeaturedScene = "msc3948.repository_room.featured_scene",
  Scene = "msc3948.repository_room.scene",
}

enum DiscoverTab {
  Home = "Home",
  Admin = "Admin",
  Creator = "Creator",
}

export function DiscoverView({ room }: { room: Room }) {
  const { session } = useHydrogen(true);

  const { getPowerLevel, canDoAction, canSendStateEvent } = usePowerLevels(room);
  const [discoverTab, setDiscoverTab] = useState<DiscoverTab>(DiscoverTab.Home);
  const [loadEvent, setLoadEvent] = useState<RepositoryEvents>();
  const [supportRoomSummary, setSupportRoomSummary] = useState(true);

  const userPowerLevel = getPowerLevel(session.userId);
  const canFeatureRooms = canSendStateEvent(RepositoryEvents.FeaturedRoom, userPowerLevel);
  const canFeatureWorlds = canSendStateEvent(RepositoryEvents.FeaturedWorld, userPowerLevel);
  const canFeatureScenes = canSendStateEvent(RepositoryEvents.FeaturedScene, userPowerLevel);
  const isAdmin = canFeatureRooms || canFeatureWorlds;
  if (!isAdmin && discoverTab === DiscoverTab.Admin) {
    setDiscoverTab(DiscoverTab.Home);
  }

  useEffect(() => {
    // Do a room summary api support check
    let controller: AbortController | undefined;
    let mounted = true;
    const run = async () => {
      controller = new AbortController();
      const response = await getRoomSummary(session, room.id, controller.signal);
      const data = await response.json();
      if (data.errcode === "M_UNRECOGNIZED" && mounted) {
        setSupportRoomSummary(false);
      }
    };
    run();
    return () => {
      mounted = false;
      controller?.abort();
    };
  }, [room.id, session]);

  return (
    <Window className="DiscoverView">
      <Content
        top={
          <Header
            left={
              <div className="flex items-center gap-xxs">
                <button style={{ cursor: "pointer" }} onClick={() => setLoadEvent(undefined)}>
                  <HeaderTitle icon={<Icon color="surface" className="shrink-0" src={ExploreIC} />}>
                    Discover
                  </HeaderTitle>
                </button>
                {loadEvent ? (
                  <>
                    <Icon src={ChevronRightIC} />
                    <HeaderTitle>{`All Public ${(() => {
                      if (loadEvent === RepositoryEvents.FeaturedRoom) return "Rooms";
                      if (loadEvent === RepositoryEvents.FeaturedWorld) return "Worlds";
                      if (loadEvent === RepositoryEvents.FeaturedScene) return "Scenes";
                    })()}`}</HeaderTitle>
                  </>
                ) : null}
              </div>
            }
            center={
              loadEvent ? null : (
                <SegmentControl>
                  <SegmentControlItem
                    value={DiscoverTab.Home}
                    isSelected={DiscoverTab.Home === discoverTab}
                    onSelect={setDiscoverTab}
                  >
                    Home
                  </SegmentControlItem>
                  <SegmentControlItem
                    value={DiscoverTab.Creator}
                    isSelected={DiscoverTab.Creator === discoverTab}
                    onSelect={setDiscoverTab}
                  >
                    Creator
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
        {loadEvent ? (
          <DiscoverAll eventType={loadEvent} room={room} />
        ) : (
          <>
            {discoverTab === DiscoverTab.Home && room && (
              <DiscoverHome supportRoomSummary={supportRoomSummary} room={room} onLoadEvent={setLoadEvent} />
            )}
            {discoverTab === DiscoverTab.Creator && room && (
              <DiscoverCreator
                room={room}
                permissions={{
                  canFeatureScenes,
                  canRedact: canDoAction("redact", userPowerLevel),
                }}
              />
            )}
            {discoverTab === DiscoverTab.Admin && room && (
              <DiscoverAdmin
                room={room}
                permissions={{
                  canFeatureRooms: canFeatureRooms && supportRoomSummary,
                  canFeatureWorlds: canFeatureWorlds && supportRoomSummary,
                  canFeatureScenes,
                }}
              />
            )}
          </>
        )}
      </Content>
    </Window>
  );
}
