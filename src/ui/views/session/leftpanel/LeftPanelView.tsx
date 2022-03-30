import React from 'react';
import './LeftPanelView.css';

import { LeftPanelViewModel } from '../../../../viewModels/session/leftpanel/LeftPanelViewModel';
import { SidebarView } from './SidebarView';
import { RoomListView } from './RoomListView';
import { useVMProp } from '../../../hooks/useVMProp';

interface ILeftPanelView {
  vm: LeftPanelViewModel;
}

export function LeftPanelView({ vm }: ILeftPanelView) {
    const panelState = useVMProp(vm, 'panelState');

    return (
        <div className={`LeftPanelView LeftPanelView--${panelState} flex`}>
            <SidebarView vm={vm.sidebarViewModel} />
            <RoomListView vm={vm.roomListViewModel} />
        </div>
    );
}
