import { Room } from "@thirdroom/hydrogen-view-sdk";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { getIdentifierColorNumber, getAvatarHttpUrl } from "../../../utils/avatar";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../atoms/avatar/AvatarOutline";
import { RoomTile } from "../../components/room-tile/RoomTile";
import { RoomTileTitle } from "../../components/room-tile/RoomTileTitle";
import { Category } from "../../components/category/Category";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { useRoomsOfType, RoomTypes } from "../../../hooks/useRoomsOfType";
import { useStore } from "../../../hooks/useStore";

export function RoomListChats() {
  const { session, platform } = useHydrogen(true);

  const [rooms] = useRoomsOfType(session, RoomTypes.Room);

  const { selectedChatId, selectChat } = useStore((state) => state.overlayChat);

  const renderAvatar = (room: Room) => {
    const avatar = (
      <Avatar
        name={room.name || "Empty room"}
        size="lg"
        shape={room.isDirectMessage ? "circle" : "rounded"}
        className="shrink-0"
        bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
        imageSrc={getAvatarHttpUrl(room.avatarUrl || "", 50, platform, room.mediaRepository)}
      />
    );
    if (selectedChatId === room.id) return <AvatarOutline>{avatar}</AvatarOutline>;
    return avatar;
  };

  return (
    <>
      <Category header={<CategoryHeader title="All Messages" />}>
        {rooms.map((room) => (
          <RoomTile
            key={room.id}
            isActive={room.id === selectedChatId}
            avatar={renderAvatar(room)}
            onClick={() => selectChat(room.id)}
            content={<RoomTileTitle>{room.name || "Empty room"}</RoomTileTitle>}
          />
        ))}
      </Category>
    </>
  );
}
