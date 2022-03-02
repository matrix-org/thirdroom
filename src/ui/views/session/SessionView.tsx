import React from "react";
import './SessionView.css';

import { SessionViewModel } from '../../../viewModels/session/SessionViewModel';
import { RoomViewModel } from '../../../viewModels/session/room/RoomViewModel';

import { LeftPanelView } from './leftpanel/LeftPanelView';
import { RoomPreview } from "./room/RoomPreview";
import { RoomLoading } from "./room/RoomLoading";
import { RoomView } from './room/RoomView';

import { useVMProp } from '../../hooks/useVMProp';

interface ISessionView {
  vm: SessionViewModel,
};

export function SessionView({ vm }: ISessionView) {
  return (
    <div className="SessionView flex">
      <LeftPanelView vm={vm.leftPanelViewModel} />
      <MiddleView vm={vm} />
    </div>
  );
}

function MiddleView({ vm }: { vm: SessionViewModel }) {
  const activeRoomId = useVMProp(vm, 'activeRoomId');

  if (!activeRoomId) return <p>select room from left panel</p>;
  if (vm.isActiveRoomInvite) return <p>invite</p>;
  return <RoomViewWrapper vm={vm.roomViewModel!} roomId={activeRoomId} />;
}

function RoomViewWrapper({ vm, roomId }: { vm: RoomViewModel, roomId: string}) {
  const roomFlow = useVMProp(vm, 'roomFlow');

  return (
    <>
      {vm.roomFlow === 'preview' && <RoomPreview vm={vm} roomId={roomId} />}
      {vm.roomFlow === 'load' && <RoomLoading vm={vm} />}
      {vm.roomFlow === 'loaded' && <RoomView vm={vm} roomId={roomId} />}
    </>
  );
}

