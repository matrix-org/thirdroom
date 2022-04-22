import { MouseEventHandler } from "react";
import { Room } from "@thirdroom/hydrogen-view-sdk";

import "./RoomListView.css";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { RoomTile } from "../../components/room-tile/RoomTile";
import { RoomTileTitle } from "../../components/room-tile/RoomTileTitle";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { IconButton } from "../../../atoms/button/IconButton";
import { RoomListTab } from "../../components/room-list-tab/RoomListTab";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import AddIC from "../../../../../res/ic/add.svg";
import HomeIC from "../../../../../res/ic/home.svg";
import LanguageIC from "../../../../../res/ic/language.svg";
import ChatIC from "../../../../../res/ic/chat.svg";
import PeoplesIC from "../../../../../res/ic/peoples.svg";
import SettingIC from "../../../../../res/ic/setting.svg";

interface RoomListViewProps {
  rooms: Room[];
  selectedRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  onCreateWorld: MouseEventHandler;
}

export function RoomListView({ rooms, selectedRoomId, onSelectRoom, onCreateWorld }: RoomListViewProps) {
  const { platform } = useHydrogen();

  return (
    <div className="RoomListView flex flex-column">
      {/* TODO: create RoomListHeaderView */}
      <header className="flex items-center justify-around">
        <RoomListTab name="Home" iconSrc={HomeIC} isActive={true} onClick={() => console.log("clicked")} />
        <RoomListTab name="Worlds" iconSrc={LanguageIC} onClick={() => console.log("clicked")} />
        <RoomListTab name="Chats" iconSrc={ChatIC} onClick={() => console.log("clicked")} />
        <RoomListTab name="Friends" iconSrc={PeoplesIC} onClick={() => console.log("clicked")} />
        <RoomListTab name="Settings" iconSrc={SettingIC} onClick={() => console.log("clicked")} />
      </header>
      <div className="RoomListView__container grow">
        <Scroll type="hover">
          <div className="RoomListView__content">
            <CategoryHeader
              title="Worlds"
              options={<IconButton size="sm" label="Create World" iconSrc={AddIC} onClick={onCreateWorld} />}
            />
            {rooms.map((room) => (
              <RoomTile
                key={room.id}
                isActive={room.id === selectedRoomId}
                onClick={() => onSelectRoom(room.id)}
                avatar={
                  <Avatar
                    name={room.name || "Empty room"}
                    size="lg"
                    shape="circle"
                    className="shrink-0"
                    bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
                    imageSrc={getAvatarHttpUrl(room.avatarUrl || "", 32, platform, room.mediaRepository)}
                  />
                }
                content={<RoomTileTitle>{room.name || "Empty room"}</RoomTileTitle>}
              />
            ))}
          </div>
        </Scroll>
      </div>
    </div>
  );
}
