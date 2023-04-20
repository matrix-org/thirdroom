import { useState } from "react";
import { Room, GroupCall, Platform, Session } from "@thirdroom/hydrogen-view-sdk";
import { useSetAtom } from "jotai";

import { Avatar } from "../../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../../atoms/avatar/AvatarOutline";
import { IconButton } from "../../../../atoms/button/IconButton";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../../utils/avatar";
import { RoomTile } from "../../../components/room-tile/RoomTile";
import { RoomTileTitle } from "../../../components/room-tile/RoomTileTitle";
import { InviteDialog } from "../../dialogs/InviteDialog";
import { WorldTileMembers } from "../WorldTileMembers";
import MoreHorizontalIC from "../../../../../../res/ic/more-horizontal.svg";
import { DropdownMenu } from "../../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../../atoms/menu/DropdownMenuItem";
import { Dialog } from "../../../../atoms/dialog/Dialog";
import { MemberListDialog } from "../../dialogs/MemberListDialog";
import { useDialog } from "../../../../hooks/useDialog";
import { OverlayWindow, overlayWindowAtom } from "../../../../state/overlayWindow";
import { activeChatsAtom } from "../../../../state/overlayChat";
import { usePowerLevels } from "../../../../hooks/usePowerLevels";

interface WorldSelectorProps {
  isSelected: boolean;
  onSelect: (roomId: string) => void;
  room: Room;
  groupCall?: GroupCall;
  session: Session;
  platform: Platform;
}

export function WorldSelector({ isSelected, onSelect, room, groupCall, platform, session }: WorldSelectorProps) {
  const { getPowerLevel, canSendStateEvent } = usePowerLevels(room);
  const setOverlayWindow = useSetAtom(overlayWindowAtom);
  const setActiveChat = useSetAtom(activeChatsAtom);
  const [focused, setFocused] = useState(false);
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
            size="xl"
            shape="circle"
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
          <RoomTileTitle>{room.name || "Empty room"}</RoomTileTitle>
          {groupCall && <WorldTileMembers session={session} platform={platform} groupCall={groupCall} />}
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
                <DropdownMenuItem onSelect={() => setActiveChat({ type: "OPEN", roomId: room.id })}>
                  Chat
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={openInviteDialog}>Invite</DropdownMenuItem>
                <DropdownMenuItem onSelect={openMemberDialog}>Members</DropdownMenuItem>
                {canSendStateEvent(undefined, getPowerLevel(session.userId)) && (
                  <DropdownMenuItem
                    onSelect={() =>
                      setOverlayWindow({
                        type: OverlayWindow.WorldSettings,
                        roomId: room.id,
                      })
                    }
                  >
                    Settings
                  </DropdownMenuItem>
                )}
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
