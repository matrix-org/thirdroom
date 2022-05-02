import { MatrixClient, Room } from "@thirdroom/matrix-js-sdk";

import "./WorldChatTimeline.css";

interface IWorldChatTimeline {
  client: MatrixClient;
  room: Room;
}

export function WorldChatTimeline({ client, room }: IWorldChatTimeline) {
  return <div className="WorldChatTimeline grow flex hydrogen" />;
}
