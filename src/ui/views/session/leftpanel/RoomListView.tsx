import React from "react";
import './RoomListView.css';

import { Text } from "../../../atoms/text/Text";

export function RoomListView() {
  return (
    <div className="RoomListView flex flex-column">
      <header className="flex items-center">
        <Text className="truncate" variant="h2" weight="semi-bold">Home</Text>
      </header>
      <div className="RoomListView__content grow">

      </div>
    </div>
  );
}
