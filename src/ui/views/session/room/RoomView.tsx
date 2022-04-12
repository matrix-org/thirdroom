import React from "react";

import "./RoomView.css";
import { RoomViewModel } from "../../../../viewModels/session/room/RoomViewModel";
import { IconButton } from "../../../atoms/button/IconButton";
import { ChatView } from "./ChatView";
import { Text } from "../../../atoms/text/Text";
import MicIC from "../../../../../res/ic/mic.svg";
import MessageIC from "../../../../../res/ic/message.svg";
import HeadphoneIC from "../../../../../res/ic/headphone.svg";
import LogoutIC from "../../../../../res/ic/logout.svg";

interface IRoomView {
  vm: RoomViewModel;
  roomId: string;
}

export function RoomFloatingView({ vm, roomId }: IRoomView) {
  const [chatVisibility, setChatVisibility] = React.useState(false);

  return (
    <>
      <div className={`RoomView__chat${chatVisibility === false ? " RoomView__chat--invisible" : ""}`}>
        {chatVisibility && <ChatView roomId={roomId} vm={vm.chatViewModel} />}
      </div>
      <div className="RoomView__controls flex">
        <div className="flex flex-column items-center">
          <IconButton
            variant="surface"
            label="Message"
            iconSrc={MessageIC}
            onClick={() => setChatVisibility(!chatVisibility)}
          />
          <Text variant="b3">Enter</Text>
        </div>
        <div className="flex flex-column items-center">
          <IconButton label="Mic" iconSrc={MicIC} onClick={() => alert("mic")} />
          <Text variant="b3">M</Text>
        </div>
        <div className="flex flex-column items-center">
          <IconButton label="Settings" iconSrc={HeadphoneIC} onClick={() => alert("Settings")} />
          <Text variant="b3">N</Text>
        </div>
        <div className="flex flex-column items-center">
          <IconButton variant="danger" label="Logout" iconSrc={LogoutIC} onClick={() => vm.setRoomFlow("preview")} />
          <Text variant="b3">Alt + L</Text>
        </div>
      </div>
    </>
  );
}

export function RoomView({ vm, roomId }: IRoomView) {
  return (
    <div className="RoomView grow flex">
      <div className="RoomView__3d grow" />
      <RoomFloatingView vm={vm} roomId={roomId} />
    </div>
  );
}
