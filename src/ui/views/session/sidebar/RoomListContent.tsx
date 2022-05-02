import { MouseEventHandler } from "react";
import { MatrixClient, Room } from "@thirdroom/matrix-js-sdk";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../atoms/avatar/AvatarOutline";
import { RoomTile } from "../../components/room-tile/RoomTile";
import { RoomTileTitle } from "../../components/room-tile/RoomTileTitle";
import { getIdentifierColorNumber } from "../../../utils/avatar";
import { IconButton } from "../../../atoms/button/IconButton";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { RoomListTabs } from "./RoomListHeader";
import AddIC from "../../../../../res/ic/add.svg";

import "./RoomListContent.css";

interface IRoomListContent {
  client: MatrixClient;
  selectedTab: RoomListTabs;
  rooms: Room[];
  selectedRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  onCreateWorld: MouseEventHandler;
}

export function RoomListContent({
  client,
  selectedTab,
  rooms,
  selectedRoomId,
  onSelectRoom,
  onCreateWorld,
}: IRoomListContent) {
  const renderAvatar = (room: Room) => {
    const avatar = (
      <Avatar
        name={room.name || "Empty room"}
        size="lg"
        shape="circle"
        className="shrink-0"
        bgColor={`var(--usercolor${getIdentifierColorNumber(room.roomId)})`}
        imageSrc={room.getAvatarUrl(client.getHomeserverUrl(), 32, 32, "crop")}
      />
    );
    if (selectedRoomId === room.roomId) return <AvatarOutline>{avatar}</AvatarOutline>;
    return avatar;
  };

  return (
    <div className="RoomListViewContent">
      <CategoryHeader
        title={selectedTab}
        options={<IconButton size="sm" label="Create World" iconSrc={AddIC} onClick={onCreateWorld} />}
      />
      {rooms.map((room) => (
        <RoomTile
          key={room.roomId}
          isActive={room.roomId === selectedRoomId}
          onClick={() => onSelectRoom(room.roomId)}
          avatar={renderAvatar(room)}
          content={<RoomTileTitle>{room.name || "Empty room"}</RoomTileTitle>}
        />
      ))}
    </div>
  );
}
