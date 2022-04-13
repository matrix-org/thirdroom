import { useState } from "react";
import classNames from "classnames";
import { Room } from "hydrogen-view-sdk";

import "./Overlay.css";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useRoomList } from "../../../hooks/useRoomList";
import { SidebarView } from "../sidebar/SidebarView";
import { WorldPreview } from "./WorldPreview";

interface OverlayProps {
  initialWorldId?: string;
  isOpen: boolean;
  isHome: boolean;
  onLoadWorld: (room: Room) => Promise<void>;
  onEnterWorld: () => Promise<void>;
}

export function Overlay({ initialWorldId, isOpen, isHome, onLoadWorld, onEnterWorld }: OverlayProps) {
  const { session } = useHydrogen();
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(initialWorldId);
  const rooms = useRoomList(session!);
  const selectedRoom = selectedRoomId && session!.rooms.get(selectedRoomId);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={classNames("Overlay", { "Overlay--home": isHome })}>
      <SidebarView open rooms={rooms} selectedRoomId={selectedRoomId} onSelectRoom={setSelectedRoomId} />
      {selectedRoom && <WorldPreview room={selectedRoom} onLoadWorld={onLoadWorld} onEnterWorld={onEnterWorld} />}
    </div>
  );
}
