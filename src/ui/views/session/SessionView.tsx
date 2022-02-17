import React from "react";
import './SessionView.css';

import { SessionViewModel } from '../../../viewModels/session/SessionViewModel';

import { LeftPanelView } from './leftpanel/LeftPanelView';
import { RoomView } from './room/RoomView';

import { useVMProp } from '../../hooks/useVMProp';

interface ISessionView {
  vm: SessionViewModel,
};

export function SessionView({ vm }: ISessionView) {
  const activeSection = useVMProp(vm, 'activeSection');
  // TODO:
  window.svm = vm;
  console.log(activeSection)
  
  return (
    <div className="SessionView flex">
      <LeftPanelView vm={vm.leftPanelViewModel} />
      {activeSection === 'room' && <RoomView />}
      {activeSection === 'invite' && <p>this is a invite</p>}
      {activeSection === 'none' && <p>select room from panels</p>}
    </div>
  );
}
