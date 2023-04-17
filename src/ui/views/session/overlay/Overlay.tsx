import classNames from "classnames";
import { GroupCall } from "@thirdroom/hydrogen-view-sdk";
import { useAtom, useAtomValue } from "jotai";

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
import { RoomListHome } from "../sidebar/RoomListHome";
import { RoomListFriends } from "../sidebar/RoomListFriends";
import { useInvite } from "../../../hooks/useInvite";
import { WorldSettings } from "../world-settings/WorldSettings";
import { RoomListNotifications } from "../sidebar/RoomListNotifications";
import { NowPlayingWorld } from "./NowPlayingWorld";
import { NowPlayingControls } from "./NowPlayingControls";
import { useCalls } from "../../../hooks/useCalls";
import { useRoomCall } from "../../../hooks/useRoomCall";
import { DiscoverView } from "../discover/DiscoverView";
import config from "../../../../../config.json";
import { activeChatsAtom, openedChatAtom } from "../../../state/overlayChat";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { SidebarTab, sidebarTabAtom } from "../../../state/sidebarTab";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";
import { worldAtom } from "../../../state/world";
import { useDisableInput } from "../../../hooks/useDisableInput";
import { useWorldNavigator } from "../../../hooks/useWorldNavigator";

export function Overlay() {
  const { session, platform } = useHydrogen(true);
  const calls = useCalls(session);

  const openedChatId = useAtomValue(openedChatAtom);
  const [activeChats, setActiveChat] = useAtom(activeChatsAtom);
  const selectedWorldId = useAtomValue(overlayWorldAtom);
  const sidebarTab = useAtomValue(sidebarTabAtom);

  const { worldId, entered: isWorldEntered } = useAtomValue(worldAtom);

  const repositoryRoom = useRoom(session, config.repositoryRoomIdOrAlias);

  const activeCall = useRoomCall(calls, worldId);
  const { navigateExitWorld } = useWorldNavigator(session);
  const world = useRoom(session, isWorldEntered ? worldId : undefined);
  const selectedChat = useRoom(session, openedChatId);
  const selectedChatInvite = useInvite(session, openedChatId);
  const overlayWindow = useAtomValue(overlayWindowAtom);
  const groupCalls = new Map<string, GroupCall>();
  Array.from(calls).flatMap(([, groupCall]) => groupCalls.set(groupCall.roomId, groupCall));

  const worldSettingRoom = useRoom(
    session,
    overlayWindow.type === OverlayWindow.WorldSettings ? overlayWindow.roomId : undefined
  );

  useDisableInput();

  const isChatOpen = selectedChat || selectedChatInvite;
  return (
    <div className={classNames("Overlay", { "Overlay--no-bg": !isWorldEntered }, "flex items-end")}>
      <SidebarView
        spaces={<SpacesView />}
        roomList={
          overlayWindow.type === OverlayWindow.None && (
            <RoomListView
              header={<RoomListHeader />}
              content={
                <RoomListContent>
                  {sidebarTab === SidebarTab.Home && <RoomListHome groupCalls={groupCalls} />}
                  {sidebarTab === SidebarTab.Friends && <RoomListFriends />}
                  {sidebarTab === SidebarTab.Notifications && <RoomListNotifications />}
                </RoomListContent>
              }
              footer={
                world && activeCall ? (
                  <NowPlayingWorld
                    world={world}
                    activeCall={activeCall}
                    onExitWorld={navigateExitWorld}
                    platform={platform}
                  />
                ) : (
                  <NowPlayingControls />
                )
              }
            />
          )
        }
      />
      {overlayWindow.type !== OverlayWindow.None ? (
        <div className="Overlay__window grow flex">
          {overlayWindow.type === OverlayWindow.CreateWorld && <CreateWorld />}
          {overlayWindow.type === OverlayWindow.UserProfile && <UserProfile />}
          {overlayWindow.type === OverlayWindow.WorldSettings && worldSettingRoom && (
            <WorldSettings room={worldSettingRoom} />
          )}
          {overlayWindow.type === OverlayWindow.Discover && repositoryRoom && <DiscoverView room={repositoryRoom} />}
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
                      onMinimize={(roomId) => setActiveChat({ type: "MINIMIZE", roomId })}
                      onClose={(roomId) => setActiveChat({ type: "CLOSE", roomId })}
                    />
                    {selectedChat && <ChatViewContent room={selectedChat} />}
                    {selectedChatInvite && <ChatViewInvite session={session} roomId={selectedChatInvite.id} />}
                  </ChatView>
                )
              }
              tiles={[...activeChats].map((rId) => {
                const room = session.rooms.get(rId) ?? session.invites.get(rId);
                if (!room) return null;
                const isActive = rId === openedChatId;

                const roomName = room.name || "Empty room";
                return (
                  <ActiveChatTile
                    key={rId}
                    isActive={isActive}
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
                    onClick={(roomId) => setActiveChat({ type: isActive ? "MINIMIZE" : "OPEN", roomId })}
                    onClose={(roomId) => setActiveChat({ type: "CLOSE", roomId })}
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
