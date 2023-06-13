import { useAtom } from "jotai";

import { SidebarTab } from "../../components/sidebar-tab/SidebarTab";
import PlanetIC from "../../../../../res/ic/planet.svg";
import PeoplesIC from "../../../../../res/ic/peoples.svg";
import ExploreIC from "../../../../../res/ic/explore.svg";
import NotificationIC from "../../../../../res/ic/notification.svg";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { BadgeWrapper } from "../../../atoms/badge/BadgeWrapper";
import { NotificationBadge } from "../../../atoms/badge/NotificationBadge";
import { useInviteList } from "../../../hooks/useInviteList";
import { UserMenu } from "../menus/UserMenu";
import "./SpacesView.css";
import { RoomTypes, useRoomsOfType } from "../../../hooks/useRoomsOfType";
import { sidebarTabAtom, SidebarTab as SidebarTabEnum } from "../../../state/sidebarTab";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";

export function SpacesView() {
  const { session } = useHydrogen(true);
  const invites = useInviteList(session);
  const [rooms] = useRoomsOfType(session, RoomTypes.Room);
  const [directs] = useRoomsOfType(session, RoomTypes.Direct);
  const [sidebarTab, setSidebarTab] = useAtom(sidebarTabAtom);
  const [overlayWindow, setOverlayWindow] = useAtom(overlayWindowAtom);

  const roomsNotifCount = rooms.reduce((total, room) => total + room.notificationCount, 0);
  const directsNotifCount = directs.reduce((total, room) => total + room.notificationCount, 0);

  return (
    <div className="SpacesView flex flex-column">
      <div className="grow flex flex-column items-center gap-xs">
        <BadgeWrapper badge={roomsNotifCount > 0 && <NotificationBadge content={roomsNotifCount} />}>
          <SidebarTab
            onClick={() => setSidebarTab(SidebarTabEnum.Home)}
            isActive={sidebarTab === SidebarTabEnum.Home && overlayWindow.type === OverlayWindow.None}
            name="Home"
            iconSrc={PlanetIC}
            variant="surface-low"
          />
        </BadgeWrapper>

        <BadgeWrapper badge={directsNotifCount > 0 && <NotificationBadge content={directsNotifCount} />}>
          <SidebarTab
            onClick={() => setSidebarTab(SidebarTabEnum.Friends)}
            isActive={sidebarTab === SidebarTabEnum.Friends && overlayWindow.type === OverlayWindow.None}
            name="Friends"
            iconSrc={PeoplesIC}
            variant="surface-low"
          />
        </BadgeWrapper>

        <BadgeWrapper badge={invites.length > 0 ? <NotificationBadge content={invites.length} /> : undefined}>
          <SidebarTab
            onClick={() => setSidebarTab(SidebarTabEnum.Notifications)}
            isActive={sidebarTab === SidebarTabEnum.Notifications && overlayWindow.type === OverlayWindow.None}
            name="Notifications"
            iconSrc={NotificationIC}
            variant="surface-low"
          />
        </BadgeWrapper>
        <SidebarTab
          onClick={() => setOverlayWindow({ type: OverlayWindow.Discover })}
          isActive={overlayWindow.type === OverlayWindow.Discover}
          name="Discover"
          iconSrc={ExploreIC}
          variant="surface-low"
        />
      </div>
      <div className="shrink-0 flex flex-column items-center gap-xs">
        <UserMenu />
      </div>
    </div>
  );
}
