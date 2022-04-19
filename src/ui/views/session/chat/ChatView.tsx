import { Room } from "hydrogen-view-sdk";

import "./ChatView.css";
import { TimelineView } from "./TimelineView";
import { ComposerView } from "./ComposerView";
import { useRoomViewModel } from "../../../hooks/useRoomViewModel";
import { Text } from "../../../atoms/text/Text";

interface IChatView {
  open: boolean;
  room: Room;
}

export function ChatView({ room, open }: IChatView) {
  const { loading, roomViewModel, error } = useRoomViewModel(room);

  if (!open) {
    return null;
  }

  return (
    <div className="ChatView flex flex-column" id="ChatView">
      {error ? (
        <div className="grow flex justify-center items-center">
          <Text>{error.message}</Text>
        </div>
      ) : loading || !roomViewModel ? (
        <div className="grow flex justify-center items-center">
          <Text>loading...</Text>
        </div>
      ) : (
        <TimelineView timelineViewModel={roomViewModel.timelineViewModel!} />
      )}
      {roomViewModel && <ComposerView composerViewModel={roomViewModel.composerViewModel} />}
    </div>
  );
}
