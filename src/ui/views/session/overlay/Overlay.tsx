import { useCallback, useEffect, useState } from "react";
import produce from "immer";
import classNames from "classnames";
import { GroupCallIntent, GroupCallType, Room } from "@thirdroom/matrix-js-sdk";
import { useNavigate } from "react-router-dom";

import "./Overlay.css";
import { getIdentifierColorNumber } from "../../../utils/avatar";
import { useMatrix } from "../../../hooks/useMatrix";
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
  const { client } = useMatrix(true);
  const [selectedRoomListTab, setSelectedRoomListTab] = useState(RoomListTabs.Home);

  const [activeChats, setActiveChats] = useState<Set<string>>(new Set());
  const [selectedChatId, setSelectedChatId] = useState<undefined | string>(undefined);
  const selectedChat = useRoom(client, selectedChatId);

  const [selectedRoomId, setSelectedRoomId] = useState(activeWorldId);
  const rooms = useRoomList(client);
  const selectedRoom = useRoom(client, selectedRoomId);
  const calls = useCalls(client);

  const navigate = useNavigate();

  const onCreateWorld = useCallback(async () => {
    const { room_id: roomId } = await client.createRoom({
      visibility: "private" as any,
      preset: "public_chat" as any,
      name: "Test World",
      power_level_content_override: {
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
          [client.getUserId()]: 100,
        },
      },
    });

    navigate(`/world/${roomId}`);
  }, [client, navigate]);

  const onLoadWorld = useCallback(
    async (room: Room) => {
      if (enteredWorld) {
        onLeftWorld();
      }

      navigate(`/world/${room.roomId}`);
      return;
    },
    [navigate, enteredWorld, onLeftWorld]
  );

  const onEnterWorld = useCallback(
    async (room: Room) => {
      const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.room.roomId === room.roomId ? call : []));

      let call = roomCalls.length && roomCalls[0];

      if (!call) {
        call = await client.createGroupCall(room.roomId, GroupCallType.Voice, GroupCallIntent.Room, [
          { label: "channel", options: {} },
        ]);
      }

      await call.enter();

      onEnteredWorld();
    },
    [client, calls, onEnteredWorld]
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
          selectedChat && (
            <ChatView client={client} room={selectedChat} onMinimize={handleMinimizeChat} onClose={handleCloseChat} />
          )
        }
        tiles={[...activeChats].map((rId) => {
          const room = client.getRoom(rId);
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
                  imageSrc={room.getAvatarUrl(client.getHomeserverUrl(), 96, 96, "crop")}
                  name={roomName}
                  bgColor={`var(--usercolor${getIdentifierColorNumber(room.roomId)})`}
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
        client={client}
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
                client={client}
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
