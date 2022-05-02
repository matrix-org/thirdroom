import { useState } from "react";
import { MatrixClient, Room } from "@thirdroom/matrix-js-sdk";

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
  client: MatrixClient;
  room: Room;
  onMinimize: (roomId: string) => void;
  onClose: (roomId: string) => void;
}

export function ChatView({ client, room, onMinimize, onClose }: ChatViewProps) {
  const roomName = room.name || "Empty room";
  const [{ error, loading }] = useState<{ error?: Error; loading: boolean }>({ error: undefined, loading: false });

  const renderMsg = (msg: string) => <div className="grow flex justify-center items-center">{msg}</div>;

  return (
    <div className="ChatView flex flex-column">
      <div className="shrink-0">
        <ChatHeader
          avatar={
            <Avatar
              imageSrc={room.getAvatarUrl(client.getHomeserverUrl(), 96, 96, "crop")}
              size="sm"
              name={roomName}
              bgColor={`var(--usercolor${getIdentifierColorNumber(room.roomId)})`}
            />
          }
          title={roomName}
          options={
            <>
              <IconButton
                variant="surface"
                label="Minimize"
                iconSrc={MinusIC}
                onClick={() => onMinimize(room.roomId)}
              />
              <IconButton variant="surface" label="Close" iconSrc={CrossIC} onClick={() => onClose(room.roomId)} />
            </>
          }
        />
      </div>
      {error && renderMsg(error.message)}
      {!error && loading && renderMsg("Loading...")}
      {!error && (
        <>
          <div className="grow">
            <ChatTimeline client={client} room={room} />
          </div>
          <div className="shrink-0">
            <ChatComposer client={client} room={room} />
          </div>
        </>
      )}
    </div>
  );
}
