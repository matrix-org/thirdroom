import React from "react";
import './LeftPanelView.css';

import { SidebarView } from './SidebarView';
import { RoomListView } from "./RoomListView";

export function LeftPanelView() {
  return (
    <div className="LeftPanelView flex">
      <SidebarView />
      <RoomListView />
    </div>
  );
}
