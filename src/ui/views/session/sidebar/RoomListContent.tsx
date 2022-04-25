import { MouseEventHandler } from "react";
import { Room } from "@thirdroom/hydrogen-view-sdk";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { RoomTile } from "../../components/room-tile/RoomTile";
import { RoomTileTitle } from "../../components/room-tile/RoomTileTitle";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { IconButton } from "../../../atoms/button/IconButton";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { RoomListTabs } from "./RoomListHeader";
import AddIC from "../../../../../res/ic/add.svg";

import "./RoomListContent.css";

interface IRoomListContent {
  selectedTab: RoomListTabs;
  rooms: Room[];
  selectedRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  onCreateWorld: MouseEventHandler;
}

export function RoomListContent({ selectedTab, rooms, selectedRoomId, onSelectRoom, onCreateWorld }: IRoomListContent) {
  const { platform } = useHydrogen();

  return (
    <div className="RoomListViewContent">
      <CategoryHeader
        title={selectedTab}
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
  );
}
