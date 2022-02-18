import React from "react";
import './RoomView.css';
import { RoomViewModel } from '../../../../viewModels/session/room/RoomViewModel';

import { ChatView } from './ChatView';

interface IRoomView {
  vm: RoomViewModel,
  roomId: string,
}

export function RoomView({
  vm,
  roomId,
}: IRoomView) {
  window.roomView = vm;
  
  return (
    <div className="RoomView grow">
      <ChatView roomId={roomId} vm={vm.chatViewModel} />
    </div>
  );
}
