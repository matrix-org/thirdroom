import React from "react";
import './SessionView.css';

import { SessionViewModel } from '../../../viewModels/session/SessionViewModel';

import { LeftPanelView } from './leftpanel/LeftPanelView';
import { RoomView } from './room/RoomView';

interface ISessionView {
  vm: SessionViewModel,
};

export function SessionView({ vm }: ISessionView) {

  // TODO:
  window.svm = vm;
  
  return (
    <div className="SessionView flex">
      <LeftPanelView vm={vm.leftPanelViewModel} />
      <RoomView />
    </div>
  );
}
