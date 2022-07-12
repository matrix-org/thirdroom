import { MouseEventHandler, useEffect, useState } from "react";
import classNames from "classnames";
import { GroupCall } from "@thirdroom/hydrogen-view-sdk";

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
import { ChatViewHeader } from "../chat/ChatViewHeader";
import { ChatViewContent } from "../chat/ChatViewContent";
import { ChatViewInvite } from "../chat/ChatViewInvite";
import { WorldPreview } from "./WorldPreview";
import { CreateWorld } from "../create-world/CreateWorld";
import { UserProfile } from "../user-profile/UserProfile";
import { useRoom } from "../../../hooks/useRoom";
import { useStore, RoomListTabs, OverlayWindow, WorldLoadState } from "../../../hooks/useStore";
import { RoomListHome } from "../sidebar/RoomListHome";
import { RoomListWorld } from "../sidebar/RoomListWorlds";
import { RoomListChats } from "../sidebar/RoomListChats";
import { RoomListFriends } from "../sidebar/RoomListFriends";
import { NowPlaying } from "../../components/now-playing/NowPlaying";
import { NowPlayingTitle } from "../../components/now-playing/NowPlayingTitle";
import { NowPlayingStatus } from "../../components/now-playing/NowPlayingStatus";
import { IconButton } from "../../../atoms/button/IconButton";
import MicIC from "../../../../../res/ic/mic.svg";
import MicOffIC from "../../../../../res/ic/mic-off.svg";
import LogoutIC from "../../../../../res/ic/logout.svg";
import { useCallMute } from "../../../hooks/useCallMute";
import { useInvite } from "../../../hooks/useInvite";
import { WorldSettings } from "../world-settings/WorldSettings";
import { RoomListNotifications } from "../sidebar/RoomListNotifications";

interface OverlayProps {
  calls: Map<string, GroupCall>;
  activeCall: GroupCall | undefined;
  onExitWorld: MouseEventHandler<HTMLButtonElement>;
  onJoinWorld: MouseEventHandler<HTMLButtonElement>;
  onLoadWorld: MouseEventHandler<HTMLButtonElement>;
  onReloadWorld: MouseEventHandler<HTMLButtonElement>;
  onEnterWorld: MouseEventHandler<HTMLButtonElement>;
}

export function Overlay({
  calls,
  activeCall,
  onExitWorld,
  onJoinWorld,
  onLoadWorld,
  onReloadWorld,
  onEnterWorld,
}: OverlayProps) {
  const { session, platform } = useHydrogen(true);

  const {
    selectedRoomListTab,
    selectRoomListTab,
    selectedChatId,
    activeChats,
    selectChat,
    minimizeChat,
    closeChat,
    worldId,
    isEnteredWorld,
    loadState,
    selectedWorldId,
  } = useStore((state) => ({
    selectedRoomListTab: state.overlaySidebar.selectedRoomListTab,
    selectRoomListTab: state.overlaySidebar.selectRoomListTab,
    selectedChatId: state.overlayChat.selectedChatId,
    activeChats: state.overlayChat.activeChats,
    selectChat: state.overlayChat.selectChat,
    minimizeChat: state.overlayChat.minimizeChat,
    closeChat: state.overlayChat.closeChat,
    worldId: state.world.worldId,
    isEnteredWorld: state.world.isEnteredWorld,
    loadState: state.world.loadState,
    selectedWorldId: state.overlayWorld.selectedWorldId,
    closeOverlay: state.overlay.closeOverlay,
  }));

  const world = useRoom(session, isEnteredWorld ? worldId : undefined);
  const selectedChat = useRoom(session, selectedChatId);
  const selectedChatInvite = useInvite(session, selectedChatId);
  const { selectedWindow, worldSettingsId } = useStore((state) => state.overlayWindow);
  const spacesEnabled = false;
  const { mute: callMute, toggleMute } = useCallMute(activeCall);
  const groupCalls = new Map<string, GroupCall>();
  Array.from(calls).flatMap(([, groupCall]) => groupCalls.set(groupCall.roomId, groupCall));

  const [worldPreviewUrl, setWorldPreviewUrl] = useState<string | undefined>();

  useEffect(() => {
    if (selectedWorldId) {
      const world = session.rooms.get(selectedWorldId);

      if (!world || "isBeingCreated" in world) {
        return;
      }

      world.getStateEvent("m.world").then((result: any) => {
        let scenePreviewUrl = result?.event?.content?.scene_preview_url;

        // eslint-disable-next-line camelcase
        if (scenePreviewUrl && scenePreviewUrl.startsWith("mxc:")) {
          // eslint-disable-next-line camelcase
          scenePreviewUrl = session.mediaRepository.mxcUrl(scenePreviewUrl);
        }

        setWorldPreviewUrl(scenePreviewUrl);
      });
    }
  }, [session, selectedWorldId]);

  const previewingWorld =
    worldId !== selectedWorldId ||
    !(
      loadState === WorldLoadState.Loaded ||
      loadState === WorldLoadState.Entering ||
      loadState === WorldLoadState.Entered
    );

  return (
    <div className={classNames("Overlay", { "Overlay--no-bg": !isEnteredWorld }, "flex items-end")}>
      {worldPreviewUrl && previewingWorld && (
        <img alt="World Preview" src={worldPreviewUrl} className="Overlay__world-preview" />
      )}
      {selectedWindow ? undefined : (
        <SidebarView
          spaces={spacesEnabled ? <SpacesView /> : undefined}
          roomList={
            <RoomListView
              header={<RoomListHeader selectedTab={selectedRoomListTab} onTabSelect={selectRoomListTab} />}
              content={
                <RoomListContent>
                  {selectedRoomListTab === RoomListTabs.Home && <RoomListHome groupCalls={groupCalls} />}
                  {selectedRoomListTab === RoomListTabs.Worlds && <RoomListWorld groupCalls={groupCalls} />}
                  {selectedRoomListTab === RoomListTabs.Chats && <RoomListChats />}
                  {selectedRoomListTab === RoomListTabs.Friends && <RoomListFriends />}
                  {selectedRoomListTab === RoomListTabs.Notifications && <RoomListNotifications />}
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
                          iconSrc={callMute ? MicOffIC : MicIC}
                          onClick={toggleMute}
                        />
                        <IconButton variant="danger" label="Left world" iconSrc={LogoutIC} onClick={onExitWorld} />
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
          {selectedWindow === OverlayWindow.WorldSettings && worldSettingsId && (
            <WorldSettings roomId={worldSettingsId} />
          )}
        </div>
      ) : (
        <div className="Overlay__content grow">
          <WorldPreview
            onJoinWorld={onJoinWorld}
            onLoadWorld={onLoadWorld}
            onReloadWorld={onReloadWorld}
            onEnterWorld={onEnterWorld}
          />
          {activeChats.size === 0 ? undefined : (
            <ActiveChats
              chat={
                (selectedChat || selectedChatInvite) && (
                  <ChatView>
                    {selectedChat && (
                      <>
                        <ChatViewHeader
                          room={selectedChat || selectedChatInvite}
                          onMinimize={minimizeChat}
                          onClose={closeChat}
                        />
                        <ChatViewContent room={selectedChat} />
                      </>
                    )}
                    {selectedChatInvite && (
                      <>
                        <ChatViewHeader
                          room={selectedChatInvite || selectedChatInvite}
                          onMinimize={minimizeChat}
                          onClose={closeChat}
                        />
                        <ChatViewInvite session={session} roomId={selectedChatInvite.id} />
                      </>
                    )}
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
