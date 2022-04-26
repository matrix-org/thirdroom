import { RoomListTab } from "../../components/room-list-tab/RoomListTab";
import HomeIC from "../../../../../res/ic/home.svg";
import LanguageIC from "../../../../../res/ic/language.svg";
import ChatIC from "../../../../../res/ic/chat.svg";
import PeoplesIC from "../../../../../res/ic/peoples.svg";
import SettingIC from "../../../../../res/ic/setting.svg";

import "./RoomListHeader.css";

export enum RoomListTabs {
  Home = "Home",
  Worlds = "Worlds",
  Chats = "Chats",
  Friends = "Friends",
  Settings = "Settings",
}

interface IRoomListHeader {
  selectedTab: RoomListTabs;
  onTabSelect: (tab: RoomListTabs) => void;
}

export function RoomListHeader({ selectedTab, onTabSelect }: IRoomListHeader) {
  return (
    <header className="RoomListHeader flex items-center justify-around">
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
