import React from "react";
import './LeftPanelView.css';

import { LeftPanelViewModel } from '../../../../viewModels/session/leftpanel/LeftPanelViewModel';

import { SidebarView } from './SidebarView';
import { RoomListView } from './RoomListView';

interface ILeftPanelView {
  vm: LeftPanelViewModel,
}

export function LeftPanelView({ vm }: ILeftPanelView) {

  return (
    <div className="LeftPanelView flex">
      <SidebarView vm={vm.sidebarViewModel} />
      <RoomListView vm={vm.roomListViewModel} />
    </div>
  );
}
