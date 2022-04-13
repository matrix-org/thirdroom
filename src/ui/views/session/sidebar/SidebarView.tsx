import { MouseEventHandler } from "react";
import { Room } from "hydrogen-view-sdk";

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
  return (
    <div className={`SidebarView SidebarView--${open ? "open" : "closed"} flex`}>
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
