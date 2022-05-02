import { MatrixClient, Room } from "@thirdroom/matrix-js-sdk";

import "./ChatTimeline.css";

interface ChatTimelineProps {
  client: MatrixClient;
  room: Room;
}

export function ChatTimeline({ client, room }: ChatTimelineProps) {
  return <div className="ChatTimeline flex" />;
}
