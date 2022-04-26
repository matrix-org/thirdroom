import { Room } from "@thirdroom/hydrogen-view-sdk";

import "./WorldChat.css";
import { WorldChatTimeline } from "./WorldChatTimeline";
import { WorldChatComposer } from "./WorldChatComposer";
import { useRoomViewModel, worldChatTileClassForEntry } from "../../../hooks/useRoomViewModel";
import { Text } from "../../../atoms/text/Text";

interface IWorldChat {
  open: boolean;
  room: Room;
}

export function WorldChat({ room, open }: IWorldChat) {
  const { loading, roomViewModel, error } = useRoomViewModel(room, worldChatTileClassForEntry);

  if (!open) {
    return null;
  }

  return (
    <div className="WorldChat flex flex-column" id="WorldChat">
      {error ? (
        <div className="grow flex justify-center items-center">
          <Text>{error.message}</Text>
        </div>
      ) : loading || !roomViewModel ? (
        <div className="grow flex justify-center items-center">
          <Text>loading...</Text>
        </div>
      ) : (
        <WorldChatTimeline timelineViewModel={roomViewModel.timelineViewModel!} />
      )}
      {roomViewModel && <WorldChatComposer composerViewModel={roomViewModel.composerViewModel} />}
    </div>
  );
}
