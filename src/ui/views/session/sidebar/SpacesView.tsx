import { SidebarTab } from "../../components/sidebar-tab/SidebarTab";
import PlanetIC from "../../../../../res/ic/planet.svg";
import PeoplesIC from "../../../../../res/ic/peoples.svg";
import ExploreIC from "../../../../../res/ic/explore.svg";
import NotificationIC from "../../../../../res/ic/notification.svg";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { OverlayWindow, SidebarTabs, useStore } from "../../../hooks/useStore";
import { BadgeWrapper } from "../../../atoms/badge/BadgeWrapper";
import { NotificationBadge } from "../../../atoms/badge/NotificationBadge";
import { useInviteList } from "../../../hooks/useInviteList";
import { UserMenu } from "../menus/UserMenu";
import "./SpacesView.css";
import { RoomTypes, useRoomsOfType } from "../../../hooks/useRoomsOfType";
import { useLocalStorage } from "../../../hooks/useLocalStorage";

export function SpacesView() {
  const { session } = useHydrogen(true);
  const invites = useInviteList(session);
  const [rooms] = useRoomsOfType(session, RoomTypes.Room);
  const [directs] = useRoomsOfType(session, RoomTypes.Direct);
  const { selectedSidebarTab, selectSidebarTab } = useStore((state) => state.overlaySidebar);
  const { selectedWindow, selectWindow } = useStore((state) => state.overlayWindow);
  const [discoverPage] = useLocalStorage("feature_discoverPage", false);

  const roomsNotifCount = rooms.reduce((total, room) => total + room.notificationCount, 0);
  const directsNotifCount = directs.reduce((total, room) => total + room.notificationCount, 0);

  return (
    <div className="SpacesView flex flex-column">
      <div className="grow flex flex-column items-center gap-xs">
        <BadgeWrapper badge={roomsNotifCount > 0 && <NotificationBadge content={roomsNotifCount} />}>
          <SidebarTab
            onClick={() => selectSidebarTab(SidebarTabs.Home)}
            isActive={selectedSidebarTab === SidebarTabs.Home && !selectedWindow}
            name="Home"
            iconSrc={PlanetIC}
            variant="surface-low"
          />
        </BadgeWrapper>

        <BadgeWrapper badge={directsNotifCount > 0 && <NotificationBadge content={directsNotifCount} />}>
          <SidebarTab
            onClick={() => selectSidebarTab(SidebarTabs.Friends)}
            isActive={selectedSidebarTab === SidebarTabs.Friends && !selectedWindow}
            name="Friends"
            iconSrc={PeoplesIC}
            variant="surface-low"
          />
        </BadgeWrapper>

        <BadgeWrapper badge={invites.length > 0 ? <NotificationBadge content={invites.length} /> : undefined}>
          <SidebarTab
            onClick={() => selectSidebarTab(SidebarTabs.Notifications)}
            isActive={selectedSidebarTab === SidebarTabs.Notifications && !selectedWindow}
            name="Notifications"
            iconSrc={NotificationIC}
            variant="surface-low"
          />
        </BadgeWrapper>
        {discoverPage && (
          <SidebarTab
            onClick={() => selectWindow(OverlayWindow.Discover)}
            isActive={selectedWindow === OverlayWindow.Discover}
            name="Discover"
            iconSrc={ExploreIC}
            variant="surface-low"
          />
        )}
      </div>
      <div className="shrink-0 flex flex-column items-center gap-xs">
        <UserMenu />
      </div>
    </div>
  );
}
