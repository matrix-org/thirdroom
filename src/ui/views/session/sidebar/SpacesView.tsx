import { SidebarTab } from "../../components/sidebar-tab/SidebarTab";
import PlanetIC from "../../../../../res/ic/planet.svg";
import PeoplesIC from "../../../../../res/ic/peoples.svg";
import NotificationIC from "../../../../../res/ic/notification.svg";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { OverlayWindow, SidebarTabs, useStore } from "../../../hooks/useStore";
import { BadgeWrapper } from "../../../atoms/badge/BadgeWrapper";
import { NotificationBadge } from "../../../atoms/badge/NotificationBadge";
import { useInviteList } from "../../../hooks/useInviteList";
import "./SpacesView.css";

export function SpacesView() {
  const { session, platform, logout } = useHydrogen(true);
  const invites = useInviteList(session);
  const { userId, displayName, avatarUrl } = useStore((state) => state.userProfile);
  const { selectedSidebarTab, selectSidebarTab } = useStore((state) => state.overlaySidebar);
  const { selectedWindow, selectWindow } = useStore((state) => state.overlayWindow);

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
        <DropdownMenu
          content={
            <>
              <DropdownMenuItem onSelect={() => selectWindow(OverlayWindow.UserProfile)}>View Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={logout} variant="danger">
                Logout
              </DropdownMenuItem>
            </>
          }
        >
          <Avatar
            onClick={() => false /* used for keyboard focus */}
            shape="circle"
            name={displayName}
            bgColor={`var(--usercolor${getIdentifierColorNumber(userId)})`}
            imageSrc={avatarUrl ? getAvatarHttpUrl(avatarUrl, 40, platform, session.mediaRepository) : undefined}
          />
        </DropdownMenu>
      </div>
    </div>
  );
}
