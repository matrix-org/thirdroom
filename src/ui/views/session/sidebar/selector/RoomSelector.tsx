import { Platform, Room } from "@thirdroom/hydrogen-view-sdk";
import { useState } from "react";

import { Avatar } from "../../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../../atoms/avatar/AvatarOutline";
import { IconButton } from "../../../../atoms/button/IconButton";
import { DropdownMenu } from "../../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../../atoms/menu/DropdownMenuItem";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../../utils/avatar";
import { RoomTile } from "../../../components/room-tile/RoomTile";
import { RoomTileTitle } from "../../../components/room-tile/RoomTileTitle";
import { InviteDialog } from "../../dialogs/InviteDialog";
import MoreHorizontalIC from "../../../../../../res/ic/more-horizontal.svg";
import { Dialog } from "../../../../atoms/dialog/Dialog";
import { MemberListDialog } from "../../dialogs/MemberListDialog";
import { useDialog } from "../../../../hooks/useDialog";
import { NotificationBadge } from "../../../../atoms/badge/NotificationBadge";
import { useRecentMessage } from "../../../../hooks/useRecentMessage";
import { Text } from "../../../../atoms/text/Text";

interface RoomSelectorProps {
  isSelected: boolean;
  onSelect: (roomId: string) => void;
  room: Room;
  platform: Platform;
}

export function RoomSelector({ isSelected, onSelect, room, platform }: RoomSelectorProps) {
  const [focused, setFocused] = useState(false);
  const eventEntry = useRecentMessage(room);

  const {
    open: openMember,
    setOpen: setMemberOpen,
    openDialog: openMemberDialog,
    closeDialog: closeMemberDialog,
  } = useDialog(false);
  const {
    open: openInvite,
    setOpen: setInviteOpen,
    openDialog: openInviteDialog,
    closeDialog: closeInviteDialog,
  } = useDialog(false);

  return (
    <RoomTile
      key={room.id}
      isActive={isSelected}
      isFocused={focused}
      avatar={((room: Room) => {
        const avatar = (
          <Avatar
            name={room.name || "Empty room"}
            size="lg"
            shape={room.isDirectMessage ? "circle" : "rounded"}
            className="shrink-0"
            bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
            imageSrc={room.avatarUrl ? getAvatarHttpUrl(room.avatarUrl, 50, platform, room.mediaRepository) : undefined}
          />
        );
        if (isSelected) return <AvatarOutline>{avatar}</AvatarOutline>;
        return avatar;
      })(room)}
      onClick={() => onSelect(room.id)}
      content={
        <>
          <div className="flex items-center gap-xxs">
            <RoomTileTitle className="grow">{room.name || "Empty room"}</RoomTileTitle>
            {(room.isUnread || room.notificationCount > 0) && (
              <NotificationBadge content={room.notificationCount > 0 ? room.notificationCount : undefined} />
            )}
          </div>
          {eventEntry?.content?.body && (
            <Text variant="b3" className="truncate">
              {`${eventEntry.displayName || eventEntry.sender}: ${eventEntry.content.body}`}
            </Text>
          )}
        </>
      }
      options={
        <>
          <Dialog open={openMember} onOpenChange={setMemberOpen}>
            <MemberListDialog room={room} requestClose={closeMemberDialog} />
          </Dialog>
          <Dialog open={openInvite} onOpenChange={setInviteOpen}>
            <InviteDialog roomId={room.id} requestClose={closeInviteDialog} />
          </Dialog>
          <DropdownMenu
            side="right"
            onOpenChange={setFocused}
            content={
              <>
                <DropdownMenuItem onSelect={openInviteDialog}>Invite</DropdownMenuItem>
                <DropdownMenuItem onSelect={openMemberDialog}>Members</DropdownMenuItem>
                <DropdownMenuItem
                  variant="danger"
                  onSelect={() => {
                    if (confirm("Are you sure?")) room.leave();
                  }}
                >
                  Leave
                </DropdownMenuItem>
              </>
            }
          >
            <IconButton label="Options" iconSrc={MoreHorizontalIC} />
          </DropdownMenu>
        </>
      }
    />
  );
}
