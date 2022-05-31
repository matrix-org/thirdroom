import { ReactNode } from "react";

import "./RoomListContent.css";

interface IRoomListContent {
  children: ReactNode;
}

export function RoomListContent({ children }: IRoomListContent) {
  return <div className="RoomListViewContent">{children}</div>;
}
