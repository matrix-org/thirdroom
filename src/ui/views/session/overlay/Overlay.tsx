import { useCallback } from "react";
import classNames from "classnames";
import { Room, RoomType } from "@thirdroom/hydrogen-view-sdk";
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
import {
  useStore,
  selectRoomListTab,
  selectWorld,
  selectChat,
  addActiveChat,
  deleteActiveChat,
} from "../../../hooks/useStore";

interface OverlayProps {
  isHome: boolean;
  onLoadWorld: (room: Room) => Promise<void>;
  onEnterWorld: (room: Room) => Promise<void>;
}

export function Overlay({ isHome, onLoadWorld, onEnterWorld }: OverlayProps) {
  const { session } = useHydrogen(true);
  const rooms = useRoomList(session);

  const selectedRoomListTab = useStore((state) => state.overlay.selectedRoomListTab);

  const activeChats = useStore((state) => state.overlay.activeChats);
  const selectedChatId = useStore((state) => state.overlay.selectedChatId);
  const selectedChat = useRoom(session, selectedChatId);

  const selectedWorldId = useStore((state) => state.overlay.selectedWorldId);
  const selectedWorld = useRoom(session, selectedWorldId);

  const { isEnteredWorld, loadedWorldId } = useStore.getState().world;

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

  const handleSelectWorld = (roomId: string | undefined) => {
    selectChat(undefined);
    selectWorld(roomId);
  };

  const handleSelectChat = (roomId: string) => {
    if (!activeChats.has(roomId)) {
      addActiveChat(roomId);
    }
    if (selectedChatId === roomId) selectChat(undefined);
    else selectChat(roomId);
  };

  const handleMinimizeChat = (roomId: string) => {
    selectChat(undefined);
  };
  const handleCloseChat = (roomId: string) => {
    if (selectedChatId === roomId) {
      selectChat(undefined);
    }
    deleteActiveChat(roomId);
  };

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
    if (!selectedWorldId) return null;
    if (selectedWorldId === loadedWorldId && isEnteredWorld) return null;

    return (
      <WorldPreview
        session={session}
        roomId={selectedWorldId}
        room={selectedWorld}
        onLoadWorld={onLoadWorld}
        onEnterWorld={onEnterWorld}
      />
    );
  };

  const isNoBg = isHome || !isEnteredWorld;
  return (
    <div className={classNames("Overlay", { "Overlay--no-bg": isNoBg }, "flex items-end")}>
      <SidebarView
        open
        spaces={<SpacesView />}
        roomList={
          <RoomListView
            header={<RoomListHeader selectedTab={selectedRoomListTab} onTabSelect={selectRoomListTab} />}
            content={
              <RoomListContent
                selectedTab={selectedRoomListTab}
                rooms={rooms}
                selectedRoomId={selectedRoomListTab === RoomListTabs.Chats ? selectedChatId : selectedWorldId}
                onSelectRoom={selectedRoomListTab === RoomListTabs.Chats ? handleSelectChat : handleSelectWorld}
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
