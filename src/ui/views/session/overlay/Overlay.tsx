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
import { useStore } from "../../../hooks/useStore";

interface OverlayProps {
  onLoadWorld: (room: Room) => Promise<void>;
  onEnterWorld: (room: Room) => Promise<void>;
}

export function Overlay({ onLoadWorld, onEnterWorld }: OverlayProps) {
  const { session } = useHydrogen(true);
  const rooms = useRoomList(session);
  const { selectedRoomListTab, selectRoomListTab } = useStore((state) => state.overlaySidebar);
  const { selectedChatId, activeChats, selectChat, minimizeChat, closeChat } = useStore((state) => state.overlayChat);
  const { selectedWorldId, selectWorld } = useStore((state) => state.overlayWorld);
  const isEnteredWorld = useStore((state) => state.world.isEnteredWorld);
  const selectedChat = useRoom(session, selectedChatId);

  const navigate = useNavigate();

  const onCreateWorld = useCallback(async () => {
    const name = "Test World";

    const roomBeingCreated = session.createRoom({
      type: RoomType.Public,
      name,
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

  const renderActiveChats = () => {
    if (activeChats.size === 0) return null;
    return (
      <ActiveChats
        chat={selectedChat && <ChatView room={selectedChat} onMinimize={minimizeChat} onClose={closeChat} />}
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
              onClick={selectChat}
              onClose={closeChat}
            />
          );
        })}
      />
    );
  };

  return (
    <div className={classNames("Overlay", { "Overlay--no-bg": !isEnteredWorld }, "flex items-end")}>
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
                onSelectRoom={selectedRoomListTab === RoomListTabs.Chats ? selectChat : selectWorld}
                onCreateWorld={onCreateWorld}
              />
            }
          />
        }
      />
      <div className="Overlay__content grow">
        <WorldPreview session={session} onLoadWorld={onLoadWorld} onEnterWorld={onEnterWorld} />
        {activeChats.size > 0 && renderActiveChats()}
      </div>
    </div>
  );
}
