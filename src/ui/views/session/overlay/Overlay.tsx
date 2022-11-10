import classNames from "classnames";
import { GroupCall } from "@thirdroom/hydrogen-view-sdk";

import "./Overlay.css";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { SidebarView } from "../sidebar/SidebarView";
import { SpacesView } from "../sidebar/SpacesView";
import { RoomListView } from "../sidebar/RoomListView";
import { RoomListHeader } from "../sidebar/RoomListHeader";
import { RoomListContent } from "../sidebar/RoomListContent";
import { ActiveChats } from "./ActiveChats";
import { ActiveChatTile } from "../../components/active-chat-tile/ActiveChatTile";
import { ChatView } from "../chat/ChatView";
import { ChatViewHeader } from "../chat/ChatViewHeader";
import { ChatViewContent } from "../chat/ChatViewContent";
import { ChatViewInvite } from "../chat/ChatViewInvite";
import { WorldPreview } from "./WorldPreview";
import { CreateWorld } from "../create-world/CreateWorld";
import { UserProfile } from "../user-profile/UserProfile";
import { useRoom } from "../../../hooks/useRoom";
import { useStore, SidebarTabs, OverlayWindow } from "../../../hooks/useStore";
import { RoomListHome } from "../sidebar/RoomListHome";
import { RoomListFriends } from "../sidebar/RoomListFriends";
import { useInvite } from "../../../hooks/useInvite";
import { WorldSettings } from "../world-settings/WorldSettings";
import { RoomListNotifications } from "../sidebar/RoomListNotifications";
import { NowPlayingWorld } from "./NowPlayingWorld";
import { NowPlayingControls } from "./NowPlayingControls";
import { useWorldAction } from "../../../hooks/useWorldAction";
import { useCalls } from "../../../hooks/useCalls";
import { useRoomCall } from "../../../hooks/useRoomCall";
import { DiscoverView } from "../discover/DiscoverView";
import config from "../../../../../config.json";

export function Overlay() {
  const { session, platform } = useHydrogen(true);
  const calls = useCalls(session);

  const {
    selectedSidebarTab,
    selectedChatId,
    activeChats,
    selectChat,
    minimizeChat,
    closeChat,
    worldId,
    isEnteredWorld,
    selectedWorldId,
  } = useStore((state) => ({
    selectedSidebarTab: state.overlaySidebar.selectedSidebarTab,
    selectSidebarTab: state.overlaySidebar.selectSidebarTab,
    selectedChatId: state.overlayChat.selectedChatId,
    activeChats: state.overlayChat.activeChats,
    selectChat: state.overlayChat.selectChat,
    minimizeChat: state.overlayChat.minimizeChat,
    closeChat: state.overlayChat.closeChat,
    worldId: state.world.worldId,
    isEnteredWorld: state.world.entered,
    selectedWorldId: state.overlayWorld.selectedWorldId,
  }));

  const repositoryRoom = useRoom(session, config.repositoryRoomIdOrAlias);

  const activeCall = useRoomCall(calls, worldId);
  const { exitWorld } = useWorldAction(session);
  const world = useRoom(session, isEnteredWorld ? worldId : undefined);
  const selectedChat = useRoom(session, selectedChatId);
  const selectedChatInvite = useInvite(session, selectedChatId);
  const { selectedWindow, worldSettingsId } = useStore((state) => state.overlayWindow);
  const groupCalls = new Map<string, GroupCall>();
  Array.from(calls).flatMap(([, groupCall]) => groupCalls.set(groupCall.roomId, groupCall));

  const isChatOpen = selectedChat || selectedChatInvite;
  return (
    <div className={classNames("Overlay", { "Overlay--no-bg": !isEnteredWorld }, "flex items-end")}>
      <SidebarView
        spaces={<SpacesView />}
        roomList={
          selectedWindow === undefined && (
            <RoomListView
              header={<RoomListHeader />}
              content={
                <RoomListContent>
                  {selectedSidebarTab === SidebarTabs.Home && <RoomListHome groupCalls={groupCalls} />}
                  {selectedSidebarTab === SidebarTabs.Friends && <RoomListFriends />}
                  {selectedSidebarTab === SidebarTabs.Notifications && <RoomListNotifications />}
                </RoomListContent>
              }
              footer={
                world && activeCall ? (
                  <NowPlayingWorld world={world} activeCall={activeCall} onExitWorld={exitWorld} platform={platform} />
                ) : (
                  <NowPlayingControls />
                )
              }
            />
          )
        }
      />
      {selectedWindow ? (
        <div className="Overlay__window grow flex">
          {selectedWindow === OverlayWindow.CreateWorld && <CreateWorld />}
          {selectedWindow === OverlayWindow.UserProfile && <UserProfile />}
          {selectedWindow === OverlayWindow.WorldSettings && worldSettingsId && (
            <WorldSettings roomId={worldSettingsId} />
          )}
          {selectedWindow === OverlayWindow.Discover && repositoryRoom && <DiscoverView room={repositoryRoom} />}
        </div>
      ) : (
        <div className="Overlay__content grow">
          {(worldId && worldId === selectedWorldId) || isChatOpen ? undefined : <WorldPreview />}
          {activeChats.size === 0 ? undefined : (
            <ActiveChats
              chat={
                isChatOpen && (
                  <ChatView>
                    <ChatViewHeader
                      platform={platform}
                      session={session}
                      room={selectedChat || selectedChatInvite!}
                      onMinimize={minimizeChat}
                      onClose={closeChat}
                    />
                    {selectedChat && <ChatViewContent room={selectedChat} />}
                    {selectedChatInvite && <ChatViewInvite session={session} roomId={selectedChatInvite.id} />}
                  </ChatView>
                )
              }
              tiles={[...activeChats].map((rId) => {
                const room = session.rooms.get(rId) ?? session.invites.get(rId);
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
                        imageSrc={
                          room.avatarUrl
                            ? getAvatarHttpUrl(room.avatarUrl, 50, platform, session.mediaRepository)
                            : undefined
                        }
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
