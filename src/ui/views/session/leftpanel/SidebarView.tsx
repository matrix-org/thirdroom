import React from "react";
import "./SidebarView.css";

import { SidebarViewModel } from "../../../../viewModels/session/leftpanel/SidebarViewModel";
import { IconButton } from "../../../atoms/button/IconButton";
import HomeIC from "../../../../../res/ic/home.svg";
import GridIC from "../../../../../res/ic/grid.svg";

interface ISidebarView {
  vm: SidebarViewModel;
}

export function SidebarView({ vm }: ISidebarView) {
  return (
    <div className="SidebarView flex flex-column">
      <div className="SidebarView__scrollable grow flex flex-column items-center">
        <IconButton label="Home" iconSrc={HomeIC} onClick={() => false} />
        <IconButton label="Grid" iconSrc={GridIC} onClick={() => false} />
      </div>
    </div>
  );
}
