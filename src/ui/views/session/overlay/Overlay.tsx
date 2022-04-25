import { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { Room, RoomType, LocalMedia, CallIntent } from "@thirdroom/hydrogen-view-sdk";
import { useNavigate } from "react-router-dom";

import "./Overlay.css";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useRoomList } from "../../../hooks/useRoomList";
import { SidebarView } from "../sidebar/SidebarView";
import { SpacesView } from "../sidebar/SpacesView";
import { RoomListView } from "../sidebar/RoomListView";
import { RoomListHeader, RoomListTabs } from "../sidebar/RoomListHeader";
import { RoomListContent } from "../sidebar/RoomListContent";
import { WorldPreview } from "./WorldPreview";
import { useRoom } from "../../../hooks/useRoom";
import { useCalls } from "../../../hooks/useCalls";
import { useKeyDown } from "../../../hooks/useKeyDown";

interface OverlayProps {
  activeWorldId?: string;
  isOpen: boolean;
  isHome: boolean;
  enteredWorld: boolean;
  onEnteredWorld: () => void;
  onLeftWorld: () => void;
  onClose: () => void;
}

export function Overlay({
  activeWorldId,
  isOpen,
  isHome,
  onClose,
  enteredWorld,
  onEnteredWorld,
  onLeftWorld,
}: OverlayProps) {
  const { session, platform } = useHydrogen(true);
  const [selectedRoomListTab, setSelectedRoomListTab] = useState(RoomListTabs.Home);
  const [selectedRoomId, setSelectedRoomId] = useState(activeWorldId);
  const rooms = useRoomList(session);
  const selectedRoom = useRoom(session, selectedRoomId);
  const calls = useCalls(session);

  const navigate = useNavigate();

  const onCreateWorld = useCallback(async () => {
    const roomBeingCreated = session.createRoom({
      type: RoomType.Public,
      name: "Test World",
      topic: undefined,
      isEncrypted: false,
      isFederationDisabled: false,
      alias: undefined,
      avatar: undefined,
      powerLevelContentOverride: {
        invite: 100,
        kick: 100,
        ban: 100,
        redact: 50,
        state_default: 0,
        events_default: 0,
        users_default: 0,
        events: {
          "m.room.power_levels": 100,
          "m.room.history_visibility": 100,
          "m.room.tombstone": 100,
          "m.room.encryption": 100,
          "m.room.name": 50,
          "m.room.message": 0,
          "m.room.encrypted": 50,
          "m.sticker": 50,
          "org.matrix.msc3401.call.member": 0,
        },
        users: {
          [session.userId]: 100,
        },
      },
    });

    navigate(`/world/${roomBeingCreated.id}`);
  }, [session, navigate]);

  const onLoadWorld = useCallback(
    async (room: Room) => {
      if (enteredWorld) {
        onLeftWorld();
      }

      navigate(`/world/${room.id}`);
      return;
    },
    [navigate, enteredWorld, onLeftWorld]
  );

  const onEnterWorld = useCallback(
    async (room: Room) => {
      const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.roomId === room.id ? call : []));

      let call = roomCalls.length && roomCalls[0];

      if (!call) {
        call = await session.callHandler.createCall(room.id, "m.voice", "Test World", CallIntent.Room);
      }

      const stream = await platform.mediaDevices.getMediaTracks(true, false);
      const localMedia = new LocalMedia().withUserMedia(stream).withDataChannel({});
      await call.join(localMedia);

      onEnteredWorld();
    },
    [platform, session, calls, onEnteredWorld]
  );

  const handleRoomListTabSelect = (selectedTab: RoomListTabs) => {
    setSelectedRoomListTab(selectedTab);
  };

  useKeyDown(
    (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    setSelectedRoomId(activeWorldId);
  }, [activeWorldId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={classNames("Overlay", { "Overlay--no-bg": isHome || !enteredWorld }, "flex")}>
      <SidebarView
        open
        spaces={<SpacesView />}
        roomList={
          <RoomListView
            header={<RoomListHeader selectedTab={selectedRoomListTab} onTabSelect={handleRoomListTabSelect} />}
            content={
              <RoomListContent
                selectedTab={selectedRoomListTab}
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onSelectRoom={setSelectedRoomId}
                onCreateWorld={onCreateWorld}
              />
            }
          />
        }
      />
      <div className="Overlay__content grow">
        {((selectedRoomId && selectedRoomId !== activeWorldId) || (selectedRoomId && !enteredWorld)) && (
          <WorldPreview
            session={session}
            roomId={selectedRoomId}
            room={selectedRoom}
            onLoadWorld={onLoadWorld}
            onEnterWorld={onEnterWorld}
          />
        )}
      </div>
    </div>
  );
}
