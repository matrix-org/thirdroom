import { MouseEventHandler, useState } from "react";
import { GroupCall, Platform, Room } from "@thirdroom/hydrogen-view-sdk";
import { useAtomValue, useSetAtom } from "jotai";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../atoms/avatar/AvatarOutline";
import { IconButton } from "../../../atoms/button/IconButton";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { NowPlaying } from "../../components/now-playing/NowPlaying";
import { NowPlayingStatus } from "../../components/now-playing/NowPlayingStatus";
import { NowPlayingTitle } from "../../components/now-playing/NowPlayingTitle";
import { MemberListDialog } from "../dialogs/MemberListDialog";
import MicIC from "../../../../../res/ic/mic.svg";
import MicOffIC from "../../../../../res/ic/mic-off.svg";
import CallCrossIC from "../../../../../res/ic/call-cross.svg";
import MoreHorizontalIC from "../../../../../res/ic/more-horizontal.svg";
import MessageIC from "../../../../../res/ic/message.svg";
import { InviteDialog } from "../dialogs/InviteDialog";
import { activeChatsAtom, openedChatAtom } from "../../../state/overlayChat";
import { manageMuteRequest, MicExceptionDialog, useMuteButton } from "../../components/MuteButtonProvider";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";
import { usePowerLevels } from "../../../hooks/usePowerLevels";
import { useHydrogen } from "../../../hooks/useHydrogen";

interface NowPlayingWorldProps {
  world: Room;
  activeCall: GroupCall;
  onExitWorld: MouseEventHandler<HTMLButtonElement>;
  platform: Platform;
}

export function NowPlayingWorld({ world, activeCall, onExitWorld, platform }: NowPlayingWorldProps) {
  const { session } = useHydrogen(true);
  const setActiveChat = useSetAtom(activeChatsAtom);
  const openedChatId = useAtomValue(openedChatAtom);
  const setOverlayWindow = useSetAtom(overlayWindowAtom);
  const { getPowerLevel, canSendStateEvent } = usePowerLevels(world);

  const [isMemberDialog, setIsMemberDialog] = useState(false);
  const [inviteDialog, setInviteDialog] = useState(false);
  const { mute, requestStream, handleMute, micException, setMicException } = useMuteButton(activeCall);

  return (
    <NowPlaying
      avatar={
        <AvatarOutline>
          <Avatar
            shape="circle"
            size="lg"
            name={world.name || "Unnamed World"}
            bgColor={`var(--usercolor${getIdentifierColorNumber(world.id)})`}
            imageSrc={world.avatarUrl && getAvatarHttpUrl(world.avatarUrl, 70, platform, world.mediaRepository)}
          />
        </AvatarOutline>
      }
      content={
        <>
          <NowPlayingStatus status="connected">Connected</NowPlayingStatus>
          <NowPlayingTitle>{world.name || "Unnamed World"}</NowPlayingTitle>
        </>
      }
      options={
        <Tooltip side="top" content={openedChatId === world.id ? "Minimize Chat" : "Open Chat"}>
          <IconButton
            onClick={() => setActiveChat({ type: openedChatId === world.id ? "MINIMIZE" : "OPEN", roomId: world.id })}
            variant="surface-low"
            label="Options"
            iconSrc={MessageIC}
          />
        </Tooltip>
      }
      leftControls={
        <>
          <MicExceptionDialog micException={micException} setMicException={setMicException} />
          <Tooltip content={mute ? "Unmute" : "Mute"}>
            <IconButton
              variant="surface-low"
              label="Mic"
              iconSrc={mute ? MicOffIC : MicIC}
              onClick={() => {
                handleMute(async () => manageMuteRequest(requestStream, setMicException));
              }}
            />
          </Tooltip>
          <Tooltip content="Disconnect">
            <IconButton variant="danger" label="Disconnect" iconSrc={CallCrossIC} onClick={onExitWorld} />
          </Tooltip>
        </>
      }
      rightControls={
        <>
          <Dialog open={isMemberDialog} onOpenChange={setIsMemberDialog}>
            <MemberListDialog room={world} requestClose={() => setIsMemberDialog(false)} />
          </Dialog>

          <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
            <InviteDialog roomId={world.id} requestClose={() => setInviteDialog(false)} />
          </Dialog>
          <DropdownMenu
            content={
              <>
                <DropdownMenuItem onSelect={() => setInviteDialog(true)}>Invite</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsMemberDialog(true)}>Members</DropdownMenuItem>
                {canSendStateEvent(undefined, getPowerLevel(session.userId)) && (
                  <DropdownMenuItem
                    onSelect={() =>
                      setOverlayWindow({
                        type: OverlayWindow.WorldSettings,
                        roomId: world.id,
                      })
                    }
                  >
                    Settings
                  </DropdownMenuItem>
                )}
              </>
            }
          >
            <IconButton variant="surface-low" label="Options" iconSrc={MoreHorizontalIC} />
          </DropdownMenu>
        </>
      }
    />
  );
}
