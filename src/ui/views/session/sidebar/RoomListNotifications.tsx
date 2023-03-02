import { Invite, Room } from "@thirdroom/hydrogen-view-sdk";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { getIdentifierColorNumber, getAvatarHttpUrl } from "../../../utils/avatar";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../atoms/avatar/AvatarOutline";
import { RoomTile } from "../../components/room-tile/RoomTile";
import { RoomTileTitle } from "../../components/room-tile/RoomTileTitle";
import { Category } from "../../components/category/Category";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { RoomTypes } from "../../../hooks/useRoomsOfType";
import { useInvitesOfType } from "../../../hooks/useInvitesOfType";
import { EmptyState } from "../../components/empty-state/EmptyState";
import { activeChatsAtom, openedChatAtom } from "../../../state/overlayChat";
import { overlayWorldAtom } from "../../../state/overlayWorld";

export function RoomListNotifications() {
  const { session, platform } = useHydrogen(true);
  const [worldInvites] = useInvitesOfType(session, RoomTypes.World);
  const [roomInvites] = useInvitesOfType(session, RoomTypes.Room);
  const [dmInvites] = useInvitesOfType(session, RoomTypes.Direct);

  const openedChatId = useAtomValue(openedChatAtom);
  const setActiveChat = useSetAtom(activeChatsAtom);
  const [selectedWorldId, selectWorld] = useAtom(overlayWorldAtom);

  const renderAvatar = (room: Room | Invite, isWorld: boolean) => {
    const avatar = (
      <Avatar
        name={room.name || "Empty room"}
        size={isWorld ? "xl" : "lg"}
        shape={isWorld || room.isDirectMessage ? "circle" : "rounded"}
        className="shrink-0"
        bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
        imageSrc={room.avatarUrl ? getAvatarHttpUrl(room.avatarUrl, 50, platform, room.mediaRepository) : undefined}
      />
    );
    if (openedChatId === room.id || selectedWorldId === room.id) return <AvatarOutline>{avatar}</AvatarOutline>;
    return avatar;
  };

  if (worldInvites.length === 0 && roomInvites.length === 0 && dmInvites.length === 0) {
    return (
      <EmptyState
        style={{ minHeight: "400px" }}
        heading="No Notification"
        text="You don't have any notifications yet."
      />
    );
  }

  return (
    <>
      {worldInvites.length > 0 && (
        <Category header={<CategoryHeader title="Invites - Worlds" />}>
          {worldInvites.map((invite) => (
            <RoomTile
              key={invite.id}
              avatar={renderAvatar(invite, true)}
              content={<RoomTileTitle>{invite.name || "Empty room"}</RoomTileTitle>}
              onClick={() => selectWorld(invite.id)}
            />
          ))}
        </Category>
      )}
      {roomInvites.length > 0 && (
        <Category header={<CategoryHeader title="Invites - Rooms" />}>
          {roomInvites.map((invite) => (
            <RoomTile
              key={invite.id}
              avatar={renderAvatar(invite, false)}
              content={<RoomTileTitle>{invite.name || "Empty room"}</RoomTileTitle>}
              onClick={() => setActiveChat({ type: "OPEN", roomId: invite.id })}
            />
          ))}
        </Category>
      )}
      {dmInvites.length > 0 && (
        <Category header={<CategoryHeader title="Invites - Direct Messages" />}>
          {dmInvites.map((invite) => (
            <RoomTile
              key={invite.id}
              avatar={renderAvatar(invite, false)}
              content={<RoomTileTitle>{invite.name || "Empty room"}</RoomTileTitle>}
              onClick={() => setActiveChat({ type: "OPEN", roomId: invite.id })}
            />
          ))}
        </Category>
      )}
    </>
  );
}
