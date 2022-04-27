import { Room } from "@thirdroom/hydrogen-view-sdk";

import { useRoomViewModel, chatTileClassForEntry } from "../../../hooks/useRoomViewModel";
import { getIdentifierColorNumber } from "../../../utils/avatar";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { IconButton } from "../../../atoms/button/IconButton";
import { ChatHeader } from "../../components/chat-header/ChatHeader";
import { ChatTimeline } from "./ChatTimeline";
import { ChatComposer } from "./ChatComposer";
import CrossIC from "../../../../../res/ic/cross.svg";
import MinusIC from "../../../../../res/ic/minus.svg";

import "./ChatView.css";

interface ChatViewProps {
  room: Room;
  onMinimize: (roomId: string) => void;
  onClose: (roomId: string) => void;
}

export function ChatView({ room, onMinimize, onClose }: ChatViewProps) {
  const roomName = room.name || "Empty room";
  const { loading, roomViewModel, error } = useRoomViewModel(room, chatTileClassForEntry);

  const renderMsg = (msg: string) => <div className="grow flex justify-center items-center">{msg}</div>;

  return (
    <div className="ChatView flex flex-column">
      <div className="shrink-0">
        <ChatHeader
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
      </div>
      {error && renderMsg(error.message)}
      {!error && (loading || !roomViewModel) && renderMsg("Loading...")}
      {!error && roomViewModel?.timelineViewModel && (
        <>
          <div className="grow">
            <ChatTimeline timelineViewModel={roomViewModel.timelineViewModel!} />
          </div>
          <div className="shrink-0">
            <ChatComposer composerViewModel={roomViewModel.composerViewModel!} />
          </div>
        </>
      )}
    </div>
  );
}
