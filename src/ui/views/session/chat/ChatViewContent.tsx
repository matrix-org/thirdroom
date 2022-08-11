import { Room } from "@thirdroom/hydrogen-view-sdk";

import { useRoomViewModel, chatTileClassForEntry } from "../../../hooks/useRoomViewModel";
import { ChatTimeline } from "./ChatTimeline";
import { ChatComposer } from "./ChatComposer";
import { Dots } from "../../../atoms/loading/Dots";

interface ChatViewContentProps {
  room: Room;
}

export function ChatViewContent({ room }: ChatViewContentProps) {
  setTimeout(() => room.clearUnread(), 1000);
  const { loading, roomViewModel, error } = useRoomViewModel(room, chatTileClassForEntry);

  return (
    <>
      {error && <div className="grow flex justify-center items-center">{error.message}</div>}
      {!error && (loading || !roomViewModel) && (
        <div className="grow flex justify-center items-center">
          <Dots color="surface-low" />
        </div>
      )}
      {!error && roomViewModel?.timelineViewModel && (
        <>
          <div className="grow">
            <ChatTimeline timelineViewModel={roomViewModel.timelineViewModel!} />
          </div>
          <div className="shrink-0">
            <ChatComposer composerViewModel={roomViewModel.composerViewModel!} />
          </div>
        </>
      )}
    </>
  );
}
