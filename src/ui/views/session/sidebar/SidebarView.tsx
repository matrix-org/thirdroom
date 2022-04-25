import { MouseEventHandler } from "react";
import { Room } from "@thirdroom/hydrogen-view-sdk";
import classNames from "classnames";

import "./SidebarView.css";
import { SpacesView } from "./SpacesView";
import { RoomListView } from "./RoomListView";

interface SidebarViewProps {
  open: boolean;
  rooms: Room[];
  selectedRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  onCreateWorld: MouseEventHandler;
}

export function SidebarView({ open, rooms, selectedRoomId, onSelectRoom, onCreateWorld }: SidebarViewProps) {
  const sidebarClass = classNames("SidebarView", { ["SidebarView--close"]: !open }, "flex");

  return (
    <div className={sidebarClass}>
      <SpacesView />
      <RoomListView
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        onSelectRoom={onSelectRoom}
        onCreateWorld={onCreateWorld}
      />
    </div>
  );
}
