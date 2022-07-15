import { ReactNode } from "react";
import classNames from "classnames";

import "./SidebarView.css";

interface SidebarViewProps {
  spaces?: ReactNode;
  roomList?: ReactNode;
}

export function SidebarView({ spaces, roomList }: SidebarViewProps) {
  return (
    <div className={classNames("SidebarView", { ["SidebarView--close"]: !open }, "flex gap-xs")}>
      {spaces && <div className="shrink-0 flex">{spaces}</div>}
      {roomList && <div className="grow flex">{roomList}</div>}
    </div>
  );
}
