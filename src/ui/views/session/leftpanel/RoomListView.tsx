import React from "react";
import './RoomListView.css';

import { Text } from "../../../atoms/text/Text";

export function RoomListView() {
  return (
    <div className="RoomListView">
      <header>
        <Text variant="h2" weight="semi-bold">Home</Text>
      </header>
      <div className="RoomListView__content">

      </div>
    </div>
  );
}
