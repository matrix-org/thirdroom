import { ReactNode } from "react";

import { Text } from "../../../atoms/text/Text";
import "./RoomTilePlaying.css";

interface IRoomTilePlaying {
  avatar: ReactNode;
  children: string;
}

export function RoomTilePlaying({ avatar, children }: IRoomTilePlaying) {
  return (
    <div className="RoomTilePlaying flex items-center">
      <div className="shrink-0">{avatar}</div>
      <div className="grow">
        <Text className="truncate" variant="b3">
          {children}
        </Text>
      </div>
    </div>
  );
}
