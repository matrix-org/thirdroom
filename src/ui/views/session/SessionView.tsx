import React from "react";
import './SessionView.css';

import { SessionViewModel } from '../../../viewModels/session/SessionViewModel';

import { Avatar } from '../../atoms/avatar/Avatar';
import { Button } from '../../atoms/button/Button';
import { LeftPanelView } from './leftpanel/LeftPanelView';
import { RoomView } from './room/RoomView';
import { InviteView } from './room/InviteView';

import { useVMProp } from '../../hooks/useVMProp';

interface ISessionView {
  vm: SessionViewModel,
};

export function SessionView({ vm }: ISessionView) {
  const activeSection = useVMProp(vm, 'activeSection');
  const activeRoomId = useVMProp(vm, 'activeRoomId');

  return (
    <div className="_SessionView flex">
      <LeftPanelView vm={vm.leftPanelViewModel} />
      <div className="grow flex flex-column">
        <header className="flex items-center justify-end">
          <Button variant="primary" onClick={() => alert('create room')}>Create room</Button>
          <Avatar
            isCircle
            size="large"
            name="Test"
            imageSrc="https://images.unsplash.com/photo-1642773156765-6f5e392dec03?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&q=80"
            bgColor="var(--bg-primary)"
          />
        </header>
        {activeSection === 'room' && <RoomView roomId={activeRoomId} vm={vm.roomViewModel!} />}
        {activeSection === 'invite' && <InviteView vm={vm.inviteViewModel!} />}
        {activeSection === 'none' && <p>select room from panels</p>}
      </div>
    </div>
  );
}
