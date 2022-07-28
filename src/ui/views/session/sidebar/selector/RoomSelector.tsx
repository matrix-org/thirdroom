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

interface RoomSelectorProps {
  isSelected: boolean;
  onSelect: (roomId: string) => void;
  room: Room;
  platform: Platform;
}

export function RoomSelector({ isSelected, onSelect, room, platform }: RoomSelectorProps) {
  const [focused, setFocused] = useState(false);
  const [isMemberDialog, setIsMemberDialog] = useState(false);

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
            imageSrc={getAvatarHttpUrl(room.avatarUrl || "", 50, platform, room.mediaRepository)}
          />
        );
        if (isSelected) return <AvatarOutline>{avatar}</AvatarOutline>;
        return avatar;
      })(room)}
      onClick={() => onSelect(room.id)}
      content={<RoomTileTitle>{room.name || "Empty room"}</RoomTileTitle>}
      options={
        <>
          <Dialog open={isMemberDialog} onOpenChange={setIsMemberDialog}>
            <MemberListDialog room={room} requestClose={() => setIsMemberDialog(false)} />
          </Dialog>
          <InviteDialog
            key={room.id}
            roomId={room.id}
            renderTrigger={(openDialog) => (
              <DropdownMenu
                side="right"
                onOpenChange={setFocused}
                content={
                  <>
                    <DropdownMenuItem onSelect={openDialog}>Invite</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsMemberDialog(true)}>Members</DropdownMenuItem>
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
            )}
          />
        </>
      }
    />
  );
}
