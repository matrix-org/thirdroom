import { Room } from "@thirdroom/hydrogen-view-sdk";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { getIdentifierColorNumber, getAvatarHttpUrl } from "../../../utils/avatar";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../atoms/avatar/AvatarOutline";
import { IconButton } from "../../../atoms/button/IconButton";
import { RoomTile } from "../../components/room-tile/RoomTile";
import { RoomTileTitle } from "../../components/room-tile/RoomTileTitle";
import { Category } from "../../components/category/Category";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { useRoomsOfType, RoomTypes } from "../../../hooks/useRoomsOfType";
import { useStore, OverlayWindow } from "../../../hooks/useStore";
import AddIC from "../../../../../res/ic/add.svg";

export function RoomListHome() {
  const { session, platform } = useHydrogen(true);

  const [worlds] = useRoomsOfType(session, RoomTypes.World);
  const [rooms] = useRoomsOfType(session, RoomTypes.Room);

  const { selectedChatId, selectChat } = useStore((state) => state.overlayChat);
  const { selectedWorldId, selectWorld } = useStore((state) => state.overlayWorld);
  const { selectWindow } = useStore((state) => state.overlayWindow);

  const renderAvatar = (room: Room, isWorld: boolean) => {
    const avatar = (
      <Avatar
        name={room.name || "Empty room"}
        size={isWorld ? "xl" : "lg"}
        shape={room.isDirectMessage || isWorld ? "circle" : "rounded"}
        className="shrink-0"
        bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
        imageSrc={getAvatarHttpUrl(room.avatarUrl || "", 50, platform, room.mediaRepository)}
      />
    );
    if (selectedChatId === room.id || selectedWorldId === room.id) return <AvatarOutline>{avatar}</AvatarOutline>;
    return avatar;
  };

  return (
    <>
      <Category
        header={
          <CategoryHeader
            title="Worlds"
            options={
              <IconButton
                size="sm"
                label="Create World"
                iconSrc={AddIC}
                onClick={() => selectWindow(OverlayWindow.CreateWorld)}
              />
            }
          />
        }
      >
        {worlds.map((room) => (
          <RoomTile
            key={room.id}
            isActive={room.id === selectedWorldId}
            avatar={renderAvatar(room, true)}
            onClick={() => selectWorld(room.id)}
            content={<RoomTileTitle>{room.name || "Empty room"}</RoomTileTitle>}
          />
        ))}
      </Category>
      <Category header={<CategoryHeader title="All Messages" />}>
        {rooms.map((room) => (
          <RoomTile
            key={room.id}
            isActive={room.id === selectedChatId}
            avatar={renderAvatar(room, false)}
            onClick={() => selectChat(room.id)}
            content={<RoomTileTitle>{room.name || "Empty room"}</RoomTileTitle>}
          />
        ))}
      </Category>
    </>
  );
}
