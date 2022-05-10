import classNames from "classnames";
import { Room } from "@thirdroom/hydrogen-view-sdk";

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
import { CreateWorld } from "../create-world/CreateWorld";
import { useRoom } from "../../../hooks/useRoom";
import { useStore, OverlayWindow } from "../../../hooks/useStore";

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
  const { selectedWindow, selectWindow } = useStore((state) => state.overlayWindow);

  return (
    <div className={classNames("Overlay", { "Overlay--no-bg": !isEnteredWorld }, "flex items-end")}>
      <SidebarView
        spaces={<SpacesView />}
        roomList={
          selectedWindow ? undefined : (
            <RoomListView
              header={<RoomListHeader selectedTab={selectedRoomListTab} onTabSelect={selectRoomListTab} />}
              content={
                <RoomListContent
                  selectedTab={selectedRoomListTab}
                  rooms={rooms}
                  selectedRoomId={selectedRoomListTab === RoomListTabs.Chats ? selectedChatId : selectedWorldId}
                  onSelectRoom={selectedRoomListTab === RoomListTabs.Chats ? selectChat : selectWorld}
                  onCreateWorld={() => selectWindow(OverlayWindow.CreateWorld)}
                />
              }
            />
          )
        }
      />
      {selectedWindow ? (
        <div className="Overlay__window grow flex">
          {selectedWindow === OverlayWindow.CreateWorld && <CreateWorld />}
        </div>
      ) : (
        <div className="Overlay__content grow">
          <WorldPreview session={session} onLoadWorld={onLoadWorld} onEnterWorld={onEnterWorld} />
          {activeChats.size === 0 ? undefined : (
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
          )}
        </div>
      )}
    </div>
  );
}
