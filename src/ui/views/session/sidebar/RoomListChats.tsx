import { Invite, Room } from "@thirdroom/hydrogen-view-sdk";

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
import { AvatarBadgeWrapper } from "../../../atoms/avatar/AvatarBadgeWrapper";
import { NotificationBadge } from "../../../atoms/badge/NotificationBadge";
import { useInvitesOfType } from "../../../hooks/useInvitesOfType";
import { IconButton } from "../../../atoms/button/IconButton";
import { JoinWithAliasDialog } from "../dialogs/JoinWithAliasDialog";
import { InviteDialog } from "../dialogs/InviteDialog";
import AddIC from "../../../../../res/ic/add.svg";
import AddUserIC from "../../../../../res/ic/add-user.svg";

export function RoomListChats() {
  const { session, platform } = useHydrogen(true);

  const [rooms] = useRoomsOfType(session, RoomTypes.Room);
  const [roomInvites] = useInvitesOfType(session, RoomTypes.Room);

  const { selectedChatId, selectChat } = useStore((state) => state.overlayChat);

  const renderAvatar = (room: Room | Invite) => {
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
      <Category
        header={
          <CategoryHeader
            title="All Messages"
            options={
              <JoinWithAliasDialog
                renderTrigger={(openDialog) => (
                  <IconButton size="sm" label="Create World" onClick={openDialog} iconSrc={AddIC} />
                )}
              />
            }
          />
        }
      >
        {roomInvites.map((invite) => (
          <RoomTile
            key={invite.id}
            avatar={
              <AvatarBadgeWrapper badge={<NotificationBadge variant="secondary" content="Invite" />}>
                {renderAvatar(invite)}
              </AvatarBadgeWrapper>
            }
            content={<RoomTileTitle>{invite.name || "Empty room"}</RoomTileTitle>}
            onClick={() => selectChat(invite.id)}
          />
        ))}
        {rooms.map((room) => (
          <RoomTile
            key={room.id}
            isActive={room.id === selectedChatId}
            avatar={renderAvatar(room)}
            onClick={() => selectChat(room.id)}
            content={<RoomTileTitle>{room.name || "Empty room"}</RoomTileTitle>}
            options={
              <InviteDialog
                key={room.id}
                roomId={room.id}
                renderTrigger={(openDialog) => (
                  <IconButton onClick={openDialog} iconSrc={AddUserIC} variant="surface-low" label="More options" />
                )}
              />
            }
          />
        ))}
      </Category>
    </>
  );
}
