import React from 'react';
import './SidebarView.css';

import { SidebarViewModel } from '../../../../viewModels/session/leftpanel/SidebarViewModel';
import { IconButton } from '../../../atoms/button/IconButton';
import { Avatar } from '../../../atoms/avatar/Avatar';
import HomeIC from '../../../../../res/ic/home.svg';
import GridIC from '../../../../../res/ic/grid.svg';
import AddIC from '../../../../../res/ic/add.svg';
import SearchIC from '../../../../../res/ic/search.svg';

interface ISidebarView {
  vm: SidebarViewModel;
}

export function SidebarView({ vm }: ISidebarView) {
    return (
        <div className="SidebarView flex flex-column">
            <div className="SidebarView__scrollable grow flex flex-column items-center">
                <IconButton
                    label="Home"
                    variant="secondary"
                    iconSrc={HomeIC}
                    isCircle
                    onClick={() => false}
                />
                <IconButton
                    label="Grid"
                    variant="secondary"
                    iconSrc={GridIC}
                    isCircle
                    onClick={() => false}
                />
                <IconButton
                    label="Create space"
                    iconSrc={AddIC}
                    isCircle
                    onClick={() => false}
                />
                <IconButton
                    label="Search"
                    iconSrc={SearchIC}
                    isCircle
                    onClick={() => false}
                />
            </div>
            <div className="SidebarView__sticky flex flex-column items-center">
                <Avatar
                    isCircle
                    name={vm.userId}
                    bgColor="var(--bg-primary-active)"
                />
            </div>
        </div>
    );
}
