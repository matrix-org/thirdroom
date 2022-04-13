import { useCallback, useState } from "react";
import classNames from "classnames";
import { ObservableValue, Room, RoomStatus, RoomType, LocalMedia } from "hydrogen-view-sdk";
import { useNavigate } from "react-router-dom";

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
  const { session, platform } = useHydrogen();
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(initialWorldId);
  const rooms = useRoomList(session!);
  const selectedRoom = selectedRoomId && session!.rooms.get(selectedRoomId);

  const navigate = useNavigate();

  const onCreateWorld = useCallback(async () => {
    const roomBeingCreated = session!.createRoom({
      type: RoomType.Public,
      name: "Test World",
      topic: undefined,
      isEncrypted: false,
      isFederationDisabled: false,
      alias: undefined,
      avatar: undefined,
    });

    const statusObservable = (await (session as any).observeRoomStatus(roomBeingCreated.id)) as ObservableValue<any>;

    await statusObservable.waitFor((status) => (status & RoomStatus.Replaced) !== 0).promise;

    const mediaTracks = await (platform as any).mediaDevices.getMediaTracks(true, false);
    const localMedia = new LocalMedia().withTracks(mediaTracks).withDataChannel({});

    await (session as any).callHandler.createCall(roomBeingCreated.roomId, localMedia, "Test World", "m.room");

    navigate(`/world/${roomBeingCreated.roomId}`);
  }, [session, navigate, platform]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={classNames("Overlay", { "Overlay--home": isHome })}>
      <SidebarView
        open
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        onSelectRoom={setSelectedRoomId}
        onCreateWorld={onCreateWorld}
      />
      {selectedRoom && <WorldPreview room={selectedRoom} onLoadWorld={onLoadWorld} onEnterWorld={onEnterWorld} />}
    </div>
  );
}
