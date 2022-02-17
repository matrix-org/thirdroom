import React from "react";
import './RoomView.css';
import { RoomViewModel } from '../../../../viewModels/session/room/RoomViewModel';

interface IRoomView {
  vm: RoomViewModel
}

export function RoomView({
  vm
}: IRoomView) {
  return (
    <div className="RoomView grow">
      room
    </div>
  );
}
