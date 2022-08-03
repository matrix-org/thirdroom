import { useReducer, useRef } from "react";
import { Room } from "@thirdroom/hydrogen-view-sdk";

import "./WorldChat.css";
import { WorldChatTimeline } from "./WorldChatTimeline";
import { WorldChatComposer } from "./WorldChatComposer";
import { useRoomViewModel, worldChatTileClassForEntry } from "../../../hooks/useRoomViewModel";
import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import MessageIC from "../../../../../res/ic/message.svg";
import { useRecentMessage } from "../../../hooks/useRecentMessage";
import { usePreviousState } from "../../../hooks/usePreviousState";

function useRecentMessages(room?: Room, maxCount = 5) {
  const eventsRef = useRef<any[]>([]);
  const [, forceUpdate] = useReducer((state) => state + 1, 0);

  const eventEntry = useRecentMessage(room);
  const prevEventEntry = usePreviousState(eventEntry);

  if (prevEventEntry && eventEntry && eventEntry !== prevEventEntry) {
    if (eventsRef.current.length >= maxCount) {
      eventsRef.current.shift();
    }
    eventsRef.current.push(eventEntry);
    setTimeout(() => {
      eventsRef.current.shift();
      forceUpdate();
    }, 5000);
  }

  if (!room) {
    eventsRef.current = [];
  }

  return eventsRef.current;
}

interface IWorldChat {
  open: boolean;
  room: Room;
}

export function WorldChat({ room, open }: IWorldChat) {
  const { loading, roomViewModel, error } = useRoomViewModel(room, worldChatTileClassForEntry);
  const events = useRecentMessages(open ? undefined : room, 5);

  const renderTimeline = () =>
    error ? (
      <div className="grow flex justify-center items-center">
        <Text>{error.message}</Text>
      </div>
    ) : loading || !roomViewModel ? (
      <div className="grow flex justify-center items-center">
        <Text>loading...</Text>
      </div>
    ) : (
      <WorldChatTimeline timelineViewModel={roomViewModel.timelineViewModel!} />
    );

  const renderTimelinePreview = () =>
    events.length > 0 && (
      <div className="grow flex items-end" style={{ padding: "var(--sp-xs) 0" }}>
        <div className="flex flex-column items-start justify-end gap-xs">
          {events.map((eventEntry) => (
            <li key={eventEntry.id} className="WorldChat__TextMessageView">
              <div className="Text Text-b2 Text--world Text--regular">
                <span className="WorldChat__TextMessageView-sender Text Text-b2 Text--world Text--semi-bold">
                  {eventEntry.displayName}
                </span>
                {eventEntry.content.body}
              </div>
            </li>
          ))}
        </div>
      </div>
    );

  return (
    <div className="WorldChat flex flex-column justify-end" id="WorldChat">
      {open ? renderTimeline() : renderTimelinePreview()}
      <div className="WorldChat__input flex items-center">
        <Icon color="world" src={MessageIC} size="sm" />
        {open && roomViewModel ? (
          <>
            <WorldChatComposer composerViewModel={roomViewModel.composerViewModel} />
            <Text variant="b3" color="world" weight="bold" className="uppercase">
              Enter
            </Text>
          </>
        ) : (
          <Text variant="b2" color="world">
            Press <b>Enter</b> to chat
          </Text>
        )}
      </div>
    </div>
  );
}
