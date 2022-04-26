import { useCallback, useEffect, useState } from "react";
import produce from "immer";
import classNames from "classnames";
import { Room, RoomType, LocalMedia, CallIntent } from "@thirdroom/hydrogen-view-sdk";
import { useNavigate } from "react-router-dom";

import "./Overlay.css";
import { getIdentifierColorNumber } from "../../../utils/avatar";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useRoomList } from "../../../hooks/useRoomList";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { SidebarView } from "../sidebar/SidebarView";
import { SpacesView } from "../sidebar/SpacesView";
import { RoomListView } from "../sidebar/RoomListView";
import { RoomListHeader, RoomListTabs } from "../sidebar/RoomListHeader";
import { RoomListContent } from "../sidebar/RoomListContent";
import { ActiveChats } from "./ActiveChats";
import { ActiveChatTile } from "../../components/active-chat-tile/ActiveChatTile";
import { ChatView } from "../chat/ChatView";
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

  const [activeChats, setActiveChats] = useState<Set<string>>(new Set());
  const [selectedChatId, setSelectedChatId] = useState<undefined | string>(undefined);
  const selectedChat = useRoom(session, selectedChatId);

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

  const handleSelectRoom = (roomId: string | undefined) => {
    setSelectedChatId(undefined);
    setSelectedRoomId(roomId);
  };

  const handleSelectChat = (roomId: string) => {
    if (!activeChats.has(roomId)) {
      setActiveChats(
        produce(activeChats, (draft) => {
          draft.add(roomId);
        })
      );
    }
    if (selectedChatId === roomId) setSelectedChatId(undefined);
    else setSelectedChatId(roomId);
  };

  const handleMinimizeChat = (roomId: string) => {
    setSelectedChatId(undefined);
  };
  const handleCloseChat = (roomId: string) => {
    if (selectedChatId === roomId) {
      setSelectedChatId(undefined);
    }
    setActiveChats(
      produce(activeChats, (draft) => {
        draft.delete(roomId);
      })
    );
  };

  useEffect(() => {
    handleSelectRoom(activeWorldId);
  }, [activeWorldId]);

  if (!isOpen) {
    return null;
  }

  const renderActiveChats = () => {
    if (activeChats.size === 0) return null;
    return (
      <ActiveChats
        chat={
          selectedChat && <ChatView room={selectedChat} onMinimize={handleMinimizeChat} onClose={handleCloseChat} />
        }
        tiles={[...activeChats].map((rId) => {
          const room = session.rooms.get(rId);
          if (!room) return null;

          const roomName = room.name || "Empty room";
          return (
            <ActiveChatTile
              key={rId}
              isActive={rId === selectedChatId}
              roomId={rId}
              avatar={
                <Avatar
                  size="sm"
                  imageSrc={room.avatarUrl}
                  name={roomName}
                  bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
                />
              }
              title={roomName}
              onClick={handleSelectChat}
              onClose={handleCloseChat}
            />
          );
        })}
      />
    );
  };

  const renderWorldPreview = () => {
    if (!((selectedRoomId && selectedRoomId !== activeWorldId) || (selectedRoomId && !enteredWorld))) return null;

    return (
      <WorldPreview
        session={session}
        roomId={selectedRoomId}
        room={selectedRoom}
        onLoadWorld={onLoadWorld}
        onEnterWorld={onEnterWorld}
      />
    );
  };

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
                selectedRoomId={selectedRoomListTab === RoomListTabs.Chats ? selectedChatId : selectedRoomId}
                onSelectRoom={selectedRoomListTab === RoomListTabs.Chats ? handleSelectChat : handleSelectRoom}
                onCreateWorld={onCreateWorld}
              />
            }
          />
        }
      />
      <div className="Overlay__content grow">
        {renderWorldPreview()}
        {activeChats.size > 0 && renderActiveChats()}
      </div>
    </div>
  );
}
