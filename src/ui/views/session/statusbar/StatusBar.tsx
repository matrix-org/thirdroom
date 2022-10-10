import { CSSProperties, ReactNode, useReducer, useRef } from "react";
import { useMatch } from "react-router-dom";
import { Session } from "@thirdroom/hydrogen-view-sdk";

import { Text } from "../../../atoms/text/Text";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useStore } from "../../../hooks/useStore";
import "./StatusBar.css";
import { useRecentMessage } from "../../../hooks/useRecentMessage";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useRoomList } from "../../../hooks/useRoomList";
import { roomIdToAlias } from "../../../utils/matrixUtils";

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
  const { selectChat } = useStore((state) => state.overlayChat);

  const handleNotificationClick = () => {
    onClick();
    if (eventEntry) selectChat(roomId);
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
interface StatusBarProps {
  showOverlayTip?: boolean;
  title?: string | null;
}

export function StatusBar({ showOverlayTip, title }: StatusBarProps) {
  const { session } = useHydrogen(true);
  const { isOpen: isOverlayOpen, closeOverlay, openOverlay } = useStore((state) => state.overlay);
  const closeWorldChat = useStore((state) => state.worldChat.closeWorldChat);

  const homeMatch = useMatch({ path: "/", end: true });
  const isHome = homeMatch !== null;
  const { worldId } = useStore((state) => state.world);
  const world = worldId ? session.rooms.get(worldId) : undefined;

  const handleTipClick = () => {
    if (isOverlayOpen) {
      closeOverlay();
    } else {
      document.exitPointerLock();
      closeWorldChat();
      openOverlay();
    }
  };

  return (
    <div className="StatusBar shrink-0 flex items-center">
      <div className="StatusBar__left grow basis-0">
        {showOverlayTip && (
          <OverlayButton style={{ paddingLeft: "var(--sp-xxs)" }} onClick={handleTipClick}>
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
              {isOverlayOpen ? "Close Overlay" : "Open Overlay"}
            </Text>
          </OverlayButton>
        )}
      </div>
      <div className="StatusBar__center">
        {title && (
          <Text color="world" weight="semi-bold">
            {isHome ? "Home" : world?.name ?? roomIdToAlias(session.rooms, worldId) ?? "Unknown"}
          </Text>
        )}
      </div>
      <div className="StatusBar__right grow basis-0 flex justify-end">
        {showOverlayTip && <NotificationButton onClick={handleTipClick} />}
      </div>
    </div>
  );
}
