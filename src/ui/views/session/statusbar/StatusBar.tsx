import { CSSProperties, ReactNode, useReducer, useRef } from "react";
import { useMatch } from "react-router-dom";
import { Session } from "@thirdroom/hydrogen-view-sdk";
import { useAtom, useSetAtom } from "jotai";

import { Text } from "../../../atoms/text/Text";
import { useHydrogen } from "../../../hooks/useHydrogen";
import "./StatusBar.css";
import { useRecentMessage } from "../../../hooks/useRecentMessage";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useRoomList } from "../../../hooks/useRoomList";
import { useWorldPath } from "../../../hooks/useWorld";
import { activeChatsAtom } from "../../../state/overlayChat";
import { worldChatVisibilityAtom } from "../../../state/worldChatVisibility";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { sidebarTabAtom, SidebarTab } from "../../../state/sidebarTab";
import { WhatsNewNotification } from "../whats-new/WhatsNewNotification";

function OverlayButton({
  style,
  children,
  onClick,
}: {
  style?: CSSProperties;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="OverlayButton" style={style} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function useNotifications(session: Session) {
  const [, forceUpdate] = useReducer((state) => state + 1, 0);
  const prevDataRef = useRef<{ count: number | undefined; eventEntry: any }>({
    count: undefined,
    eventEntry: undefined,
  });

  const rooms = useRoomList(session).filter((room) => !room.type);
  const notifCount = rooms.reduce((total, room) => total + room.notificationCount, 0);
  const eventEntry = useRecentMessage(rooms[0]);

  if (prevDataRef.current.count !== notifCount) {
    prevDataRef.current.eventEntry = eventEntry;
    setTimeout(() => {
      if (eventEntry === prevDataRef.current.eventEntry) {
        prevDataRef.current.eventEntry = undefined;
        prevDataRef.current.count = notifCount;
        forceUpdate();
      }
    }, 5000);
  }

  const prevCount = prevDataRef.current.count;
  return {
    notifCount: notifCount,
    eventEntry: prevCount !== undefined && notifCount > prevCount ? prevDataRef.current.eventEntry : undefined,
    roomId: rooms[0]?.id,
  };
}
export function NotificationButton({ onClick }: { onClick: () => void }) {
  const { session, platform } = useHydrogen(true);
  const { notifCount, eventEntry, roomId } = useNotifications(session);
  const selectChat = useSetAtom(activeChatsAtom);

  const handleNotificationClick = () => {
    onClick();
    if (eventEntry) selectChat({ type: "OPEN", roomId });
  };

  return (
    <OverlayButton onClick={handleNotificationClick}>
      {eventEntry ? (
        <>
          <Avatar
            className="shrink-0"
            shape="circle"
            size="xxs"
            imageSrc={
              eventEntry.avatarUrl
                ? getAvatarHttpUrl(eventEntry.avatarUrl, 20, platform, session.mediaRepository)
                : undefined
            }
            bgColor={`var(--usercolor${getIdentifierColorNumber(eventEntry.sender)})`}
            name={eventEntry.displayName}
          />
          <Text variant="b3" className="truncate" color="world">
            {`${eventEntry.displayName}: ${eventEntry.content.body}`}
          </Text>
        </>
      ) : (
        <Text variant="b3" color="world">
          {`${notifCount} Notifications`}
        </Text>
      )}
    </OverlayButton>
  );
}

export function StatusBar() {
  const { session } = useHydrogen(true);
  const [overlayVisible, setOverlayVisibility] = useAtom(overlayVisibilityAtom);
  const setWorldChatVisibility = useSetAtom(worldChatVisibilityAtom);
  const setSidebarTab = useSetAtom(sidebarTabAtom);

  const homeMatch = useMatch({ path: "/", end: true });
  const isHome = homeMatch !== null;
  const [knownWorldId] = useWorldPath();
  const world = knownWorldId ? session.rooms.get(knownWorldId) : undefined;

  const openOverlay = () => {
    if (overlayVisible) {
      setOverlayVisibility(false);
    } else {
      document.exitPointerLock();
      setWorldChatVisibility(false);
      setOverlayVisibility(true);
    }
  };

  const openNotifications = () => {
    if (overlayVisible) {
      setOverlayVisibility(false);
    } else {
      document.exitPointerLock();
      setWorldChatVisibility(false);
      setOverlayVisibility(true);
      setSidebarTab(SidebarTab.Notifications);
    }
  };

  return (
    <div className="StatusBar shrink-0 flex items-center">
      <div className="StatusBar__left grow basis-0 flex">
        {knownWorldId && (
          <OverlayButton style={{ paddingLeft: "var(--sp-xxs)" }} onClick={openOverlay}>
            <Text
              color="world"
              weight="medium"
              variant="b3"
              style={{
                padding: "0 3px",
                borderRadius: "var(--br-xxs)",
                border: "1px solid var(--bg-world-border)",
              }}
            >
              ESC
            </Text>
            <Text className="flex items-center" color="world" variant="b3">
              {overlayVisible ? "Close Overlay" : "Open Overlay"}
            </Text>
          </OverlayButton>
        )}
      </div>
      <div className="StatusBar__center">
        <Text color="world" weight="semi-bold">
          {isHome ? "Home" : world?.name ?? world?.canonicalAlias ?? "Unknown"}
        </Text>
      </div>
      <div className="StatusBar__right grow basis-0 flex justify-end gap-xxs">
        <WhatsNewNotification />
        {knownWorldId && <NotificationButton onClick={openNotifications} />}
      </div>
    </div>
  );
}
