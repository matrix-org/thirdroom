import { ReactNode } from "react";

import { Scroll } from "../../../atoms/scroll/Scroll";
import "./RoomListView.css";

interface RoomListViewProps {
  header: ReactNode;
  content: ReactNode;
}

export function RoomListView({ header, content }: RoomListViewProps) {
  return (
    <div className="RoomListView flex flex-column">
      {header}
      <div className="RoomListView__container grow">
        <Scroll type="hover">{content}</Scroll>
      </div>
    </div>
  );
}
