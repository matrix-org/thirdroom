import { Room } from "hydrogen-view-sdk";

import "./SidebarView.css";
import { SpacesView } from "./SpacesView";
import { RoomListView } from "./RoomListView";

interface SidebarViewProps {
  open: boolean;
  rooms: Room[];
  selectedRoomId?: string;
  onSelectRoom: (roomId: string) => void;
}

export function SidebarView({ open, rooms, selectedRoomId, onSelectRoom }: SidebarViewProps) {
  return (
    <div className={`SidebarView SidebarView--${open ? "open" : "closed"} flex`}>
      <SpacesView />
      <RoomListView rooms={rooms} selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} />
    </div>
  );
}
