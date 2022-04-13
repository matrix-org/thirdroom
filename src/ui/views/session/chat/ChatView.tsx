import { Ref } from "react";
import { Room } from "hydrogen-view-sdk";

import "./ChatView.css";
import { TimelineView } from "./TimelineView";
import { ComposerView } from "./ComposerView";
import { useRoomViewModel } from "../../../hooks/useRoomViewModel";
import { Text } from "../../../atoms/text/Text";

interface IChatView {
  room: Room;
  composerInputRef: Ref<HTMLInputElement>;
}

export function ChatView({ room, composerInputRef }: IChatView) {
  const { loading, roomViewModel, error } = useRoomViewModel(room);

  return (
    <div className="ChatView flex flex-column" id="ChatView">
      {error ? (
        <div className="grow flex justify-center items-center">
          <Text>{error.message}</Text>
        </div>
      ) : loading ? (
        <div className="grow flex justify-center items-center">
          <Text>loading...</Text>
        </div>
      ) : (
        <TimelineView timelineViewModel={roomViewModel!.timelineViewModel!} />
      )}
      {roomViewModel && !(room as any).isArchived && (
        <ComposerView inputRef={composerInputRef} composerViewModel={roomViewModel.composerViewModel} />
      )}
    </div>
  );
}
