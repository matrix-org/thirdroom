import classNames from "classnames";
import { GroupCall, Room } from "@thirdroom/hydrogen-view-sdk";

import "./Overlay.css";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../atoms/avatar/AvatarOutline";
import { SidebarView } from "../sidebar/SidebarView";
import { SpacesView } from "../sidebar/SpacesView";
import { RoomListView } from "../sidebar/RoomListView";
import { RoomListHeader } from "../sidebar/RoomListHeader";
import { RoomListContent } from "../sidebar/RoomListContent";
import { ActiveChats } from "./ActiveChats";
import { ActiveChatTile } from "../../components/active-chat-tile/ActiveChatTile";
import { ChatView } from "../chat/ChatView";
import { WorldPreview } from "./WorldPreview";
import { CreateWorld } from "../create-world/CreateWorld";
import { UserProfile } from "../user-profile/UserProfile";
import { useRoom } from "../../../hooks/useRoom";
import { useStore, RoomListTabs, OverlayWindow } from "../../../hooks/useStore";
import { RoomListHome } from "../sidebar/RoomListHome";
import { RoomListWorld } from "../sidebar/RoomListWorlds";
import { RoomListChats } from "../sidebar/RoomListChats";
import { RoomListFriends } from "../sidebar/RoomListFriends";
import { NowPlaying } from "../../components/now-playing/NowPlaying";
import { NowPlayingTitle } from "../../components/now-playing/NowPlayingTitle";
import { NowPlayingStatus } from "../../components/now-playing/NowPlayingStatus";
import { IconButton } from "../../../atoms/button/IconButton";
import MicIC from "../../../../../res/ic/mic.svg";
import HeadphoneIC from "../../../../../res/ic/headphone.svg";
import LogoutIC from "../../../../../res/ic/logout.svg";

interface OverlayProps {
  calls: Map<string, GroupCall>;
  activeCall: GroupCall | undefined;
  onLeftWorld: () => void;
  onLoadWorld: (room: Room) => Promise<void>;
  onEnterWorld: (room: Room) => Promise<void>;
}

export function Overlay({ calls, activeCall, onLeftWorld, onLoadWorld, onEnterWorld }: OverlayProps) {
  const { session, platform } = useHydrogen(true);

  const { selectedRoomListTab, selectRoomListTab } = useStore((state) => state.overlaySidebar);
  const { selectedChatId, activeChats, selectChat, minimizeChat, closeChat } = useStore((state) => state.overlayChat);
  const { worldId, isEnteredWorld } = useStore((state) => state.world);
  const world = useRoom(session, isEnteredWorld ? worldId : undefined);
  const selectedChat = useRoom(session, selectedChatId);
  const { selectedWindow } = useStore((state) => state.overlayWindow);
  const spacesEnabled = false;
  const groupCalls = new Map<string, GroupCall>();
  Array.from(calls).flatMap(([, groupCall]) => groupCalls.set(groupCall.roomId, groupCall));

  return (
    <div className={classNames("Overlay", { "Overlay--no-bg": !isEnteredWorld }, "flex items-end")}>
      {selectedWindow ? undefined : (
        <SidebarView
          spaces={spacesEnabled ? <SpacesView /> : undefined}
          roomList={
            <RoomListView
              header={<RoomListHeader selectedTab={selectedRoomListTab} onTabSelect={selectRoomListTab} />}
              content={
                <RoomListContent>
                  {selectedRoomListTab === RoomListTabs.Home && <RoomListHome groupCalls={groupCalls} />}
                  {selectedRoomListTab === RoomListTabs.Worlds && <RoomListWorld />}
                  {selectedRoomListTab === RoomListTabs.Chats && <RoomListChats />}
                  {selectedRoomListTab === RoomListTabs.Friends && <RoomListFriends />}
                </RoomListContent>
              }
              footer={
                world && (
                  <NowPlaying
                    avatar={
                      <AvatarOutline>
                        <Avatar
                          shape="circle"
                          size="lg"
                          name={world.name || "Unnamed World"}
                          bgColor={`var(--usercolor${getIdentifierColorNumber(world.id)})`}
                          imageSrc={getAvatarHttpUrl(world.avatarUrl || "", 70, platform, world.mediaRepository)}
                        />
                      </AvatarOutline>
                    }
                    content={
                      <>
                        <NowPlayingStatus status="connected">Connected</NowPlayingStatus>
                        <NowPlayingTitle>{world.name || "Unnamed World"}</NowPlayingTitle>
                      </>
                    }
                    leftControls={
                      <>
                        <IconButton
                          variant="surface-low"
                          label="Mic"
                          iconSrc={MicIC}
                          onClick={(a) => console.log("clicked")}
                        />
                        <IconButton
                          variant="surface-low"
                          label="Headphone"
                          iconSrc={HeadphoneIC}
                          onClick={(a) => console.log("clicked")}
                        />
                        <IconButton
                          variant="danger"
                          label="Left world"
                          iconSrc={LogoutIC}
                          onClick={(a) => onLeftWorld()}
                        />
                      </>
                    }
                  />
                )
              }
            />
          }
        />
      )}
      {selectedWindow ? (
        <div className="Overlay__window grow flex">
          {selectedWindow === OverlayWindow.CreateWorld && <CreateWorld />}
          {selectedWindow === OverlayWindow.UserProfile && <UserProfile />}
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
