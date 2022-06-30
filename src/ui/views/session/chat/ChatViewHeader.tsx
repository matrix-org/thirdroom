import { Invite, Room } from "@thirdroom/hydrogen-view-sdk";

import { ChatHeader } from "../../components/chat-header/ChatHeader";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { IconButton } from "../../../atoms/button/IconButton";
import { getIdentifierColorNumber } from "../../../utils/avatar";
import CrossIC from "../../../../../res/ic/cross.svg";
import MinusIC from "../../../../../res/ic/minus.svg";

interface ChatViewHeaderProps {
  room: Room | Invite;
  onMinimize: (roomId: string) => void;
  onClose: (roomId: string) => void;
}

export function ChatViewHeader({ room, onMinimize, onClose }: ChatViewHeaderProps) {
  const roomName = room.name || "Empty room";
  return (
    <ChatHeader
      className="shrink-0"
      avatar={
        <Avatar
          imageSrc={room.avatarUrl}
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
