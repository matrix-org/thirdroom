import { Invite, Platform, Room, Session } from "@thirdroom/hydrogen-view-sdk";

import { ChatHeader } from "../../components/chat-header/ChatHeader";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { IconButton } from "../../../atoms/button/IconButton";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import CrossIC from "../../../../../res/ic/cross.svg";
import MinusIC from "../../../../../res/ic/minus.svg";

interface ChatViewHeaderProps {
  room: Room | Invite;
  session: Session;
  platform: Platform;
  onMinimize: (roomId: string) => void;
  onClose: (roomId: string) => void;
}

export function ChatViewHeader({ room, platform, session, onMinimize, onClose }: ChatViewHeaderProps) {
  const roomName = room.name || "Empty room";

  return (
    <ChatHeader
      className="shrink-0"
      avatar={
        <Avatar
          imageSrc={
            room.avatarUrl ? getAvatarHttpUrl(room.avatarUrl, 50, platform, session.mediaRepository) : undefined
          }
          size="sm"
          name={roomName}
          bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
        />
      }
      title={roomName}
      options={
        <>
          <IconButton variant="surface" label="Minimize" iconSrc={MinusIC} onClick={() => onMinimize(room.id)} />
          <IconButton variant="surface" label="Close" iconSrc={CrossIC} onClick={() => onClose(room.id)} />
        </>
      }
    />
  );
}
