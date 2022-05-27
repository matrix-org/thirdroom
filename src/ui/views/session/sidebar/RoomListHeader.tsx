import { useHydrogen } from "../../../hooks/useHydrogen";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { RoomListTab } from "../../components/room-list-tab/RoomListTab";
import { useStore, RoomListTabs, OverlayWindow } from "../../../hooks/useStore";
import { getIdentifierColorNumber } from "../../../utils/avatar";
import HomeIC from "../../../../../res/ic/home.svg";
import LanguageIC from "../../../../../res/ic/language.svg";
import ChatIC from "../../../../../res/ic/chat.svg";
import PeoplesIC from "../../../../../res/ic/peoples.svg";
import SettingIC from "../../../../../res/ic/setting.svg";
import "./RoomListHeader.css";

interface IRoomListHeader {
  selectedTab: RoomListTabs;
  onTabSelect: (tab: RoomListTabs) => void;
}

export function RoomListHeader({ selectedTab, onTabSelect }: IRoomListHeader) {
  const { logout } = useHydrogen(true);
  const { userId, displayName, avatarUrl } = useStore((state) => state.userProfile);
  const { selectWindow } = useStore((state) => state.overlayWindow);

  return (
    <header className="RoomListHeader flex items-center justify-around">
      <DropdownMenu
        content={
          <>
            <DropdownMenuItem onSelect={() => selectWindow(OverlayWindow.UserProfile)}>Profile</DropdownMenuItem>
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
          imageSrc={avatarUrl}
        />
      </DropdownMenu>
      <RoomListTab
        name="Home"
        iconSrc={HomeIC}
        isActive={selectedTab === RoomListTabs.Home}
        onClick={() => onTabSelect(RoomListTabs.Home)}
      />
      <RoomListTab
        name="Worlds"
        iconSrc={LanguageIC}
        isActive={selectedTab === RoomListTabs.Worlds}
        onClick={() => onTabSelect(RoomListTabs.Worlds)}
      />
      <RoomListTab
        name="Chats"
        iconSrc={ChatIC}
        isActive={selectedTab === RoomListTabs.Chats}
        onClick={() => onTabSelect(RoomListTabs.Chats)}
      />
      <RoomListTab
        name="Friends"
        iconSrc={PeoplesIC}
        isActive={selectedTab === RoomListTabs.Friends}
        onClick={() => onTabSelect(RoomListTabs.Friends)}
      />
      <RoomListTab
        name="Settings"
        iconSrc={SettingIC}
        isActive={selectedTab === RoomListTabs.Settings}
        onClick={() => onTabSelect(RoomListTabs.Settings)}
      />
    </header>
  );
}
