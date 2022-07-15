import { SidebarTab } from "../../components/sidebar-tab/SidebarTab";
import PlanetIC from "../../../../../res/ic/planet.svg";
import PeoplesIC from "../../../../../res/ic/peoples.svg";
import NotificationIC from "../../../../../res/ic/notification.svg";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { SidebarTabs, useStore } from "../../../hooks/useStore";
import { BadgeWrapper } from "../../../atoms/badge/BadgeWrapper";
import { NotificationBadge } from "../../../atoms/badge/NotificationBadge";
import { useInviteList } from "../../../hooks/useInviteList";
import { UserMenu } from "../menus/UserMenu";
import "./SpacesView.css";

export function SpacesView() {
  const { session } = useHydrogen(true);
  const invites = useInviteList(session);
  const { selectedSidebarTab, selectSidebarTab } = useStore((state) => state.overlaySidebar);
  const { selectedWindow } = useStore((state) => state.overlayWindow);

  return (
    <div className="SpacesView flex flex-column">
      <div className="grow flex flex-column items-center gap-xs">
        <SidebarTab
          onClick={() => selectSidebarTab(SidebarTabs.Home)}
          isActive={selectedSidebarTab === SidebarTabs.Home && !selectedWindow}
          name="Home"
          iconSrc={PlanetIC}
          variant="surface-low"
        />

        <SidebarTab
          onClick={() => selectSidebarTab(SidebarTabs.Friends)}
          isActive={selectedSidebarTab === SidebarTabs.Friends && !selectedWindow}
          name="Friends"
          iconSrc={PeoplesIC}
          variant="surface-low"
        />

        <BadgeWrapper badge={invites.length > 0 ? <NotificationBadge content={invites.length} /> : undefined}>
          <SidebarTab
            onClick={() => selectSidebarTab(SidebarTabs.Notifications)}
            isActive={selectedSidebarTab === SidebarTabs.Notifications && !selectedWindow}
            name="Notifications"
            iconSrc={NotificationIC}
            variant="surface-low"
          />
        </BadgeWrapper>
      </div>
      <div className="shrink-0 flex flex-column items-center gap-xs">
        <UserMenu />
      </div>
    </div>
  );
}
