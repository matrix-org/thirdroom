import { Room } from "@thirdroom/hydrogen-view-sdk";

import "./WorldChat.css";
import { WorldChatTimeline } from "./WorldChatTimeline";
import { WorldChatComposer } from "./WorldChatComposer";
import { useRoomViewModel, worldChatTileClassForEntry } from "../../../hooks/useRoomViewModel";
import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import MessageIC from "../../../../../res/ic/message.svg";

interface IWorldChat {
  open: boolean;
  room: Room;
}

export function WorldChat({ room, open }: IWorldChat) {
  const { loading, roomViewModel, error } = useRoomViewModel(room, worldChatTileClassForEntry);

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

  return (
    <div className="WorldChat flex flex-column justify-end" id="WorldChat">
      {open && renderTimeline()}
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
