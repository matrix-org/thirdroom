import React from "react";
import './SidebarView.css';

import { SidebarViewModel } from '../../../../viewModels/session/leftpanel/SidebarViewModel';

import { IconButton } from '../../../atoms/button/IconButton';

import HomeIC from '../../../../../res/ic/home.svg';
import GridIC from '../../../../../res/ic/grid.svg';
import AddIC from '../../../../../res/ic/add.svg';
import SearchIC from '../../../../../res/ic/search.svg';

interface ISidebarView {
  vm: SidebarViewModel,
}

export function SidebarView({ vm }: ISidebarView) {
  return (
    <div className="SidebarView flex flex-column items-center">
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
  );
}
