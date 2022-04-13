import { Ref } from "react";
import { useOutletContext } from "react-router-dom";

import { useRoomById } from "../../../hooks/useRoomById";
import { useWorldId } from "../../../hooks/useWorldId";
import { ChatView } from "../chat/ChatView";
import { Stats } from "../stats/Stats";
import "./WorldView.css";

export function WorldView() {
  const worldId = useWorldId();
  const room = useRoomById(worldId);

  const { composerInputRef } = useOutletContext<{ composerInputRef: Ref<HTMLInputElement> }>();

  if (!room) {
    return null;
  }

  return (
    <div className="WorldView">
      <Stats />
      <div className="WorldView__chat">
        <ChatView room={room} composerInputRef={composerInputRef} />
      </div>
    </div>
  );
}
